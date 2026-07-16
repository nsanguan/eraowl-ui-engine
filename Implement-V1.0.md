# EraOwl UI Engine — Implementation Plan

> **เอกสารนี้เป็น Reference เดียว (Single Source of Truth)** สำหรับสั่งงาน AI Agent (Claude Code / LangGraph) ในการพัฒนา `eraowl-ui-engine` — ครอบคลุม Architecture, Project Structure, Tech Stack, Database/JSON Schema, Security Contract, Roadmap และกลไกการ Generate โค้ดเข้า Target Project จริง

---

## 1. Executive Summary

EraOwl UI Engine คือ Low-code Render Engine แบบ Plug-and-Play ที่แยก Repository ออกจากระบบธุรกิจ (เช่น AXON WMS, EraOwl-OPS) แต่สามารถ**เชื่อมต่อและ Generate โค้ดเข้าไปใน Project เป้าหมายได้โดยตรง** ผ่านกลไก Target Project Adapter (ดู §8)

หลักการออกแบบ:
- **Decoupled Core**: Render Engine ไม่ผูกกับ Business Logic ของโปรเจกต์ใดโปรเจกต์หนึ่ง
- **Convention-aware Codegen**: ก่อน Generate โค้ดเข้า Target Project ต้องสแกนโครงสร้างเดิมก่อนเสมอ เพื่อให้โค้ดที่ Gen ออกมากลมกลืนกับของเดิม (Naming, Folder Layout, Import Style)
- **Security by Default**: ไม่มี Raw SQL/Raw eval จาก Config, มี Auth/RBAC, มี Sandbox ก่อนเขียนไฟล์จริง
- **Agent-Native**: ทุก Module ออกแบบให้ AI Agent อ่าน Contract แล้วเขียนโค้ดต่อได้เองโดยไม่หลุด Guardrail
- **Universal Theme**: ระบบ Theme แบบ Oracle APEX UT — Theme Catalog + Theme Style presets + Theme Roller + Template Options เพื่อให้ผู้ใช้เลือก "หน้าตา" ได้โดยไม่ต้องเขียน CSS; ทุก Component ใช้ Design Tokens และ Declarative Options เท่านั้น (ดู §2.8)

---

## 2. Architecture

### 2.1 System Context

```
┌───────────────────────────────────────────────────────────────────────┐
│                          EraOwl Group Ecosystem                        │
│                                                                          │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐     │
│   │   AXON WMS        │   │  EraOwl-OPS       │   │  Target Project  │     │
│   │  (Oracle EBS +    │   │  (/u01/eraowl-ops)│   │   N (future)      │     │
│   │   PostgreSQL)      │   │                    │   │                    │     │
│   └─────────▲─────────┘   └─────────▲─────────┘   └─────────▲─────────┘     │
│             │ Codegen Output           │ Codegen Output           │                │
│             └────────────┬─────────────┴────────────┬─────────────┘                │
│                          │                          │                              │
│                 ┌────────┴──────────────────────────┴────────┐                     │
│                 │           EraOwl UI Engine (this repo)        │                     │
│                 │   Standalone service — ไม่ผูกกับ Business Logic  │                     │
│                 └───────────────────────────────────────────────┘                     │
└───────────────────────────────────────────────────────────────────────┘
```

UI Engine เป็น **Service กลาง** ที่โปรเจกต์อื่นในเครือ "ดึงไปใช้" (ผ่าน API สำหรับ Runtime Render) หรือ "ให้ Gen โค้ดเข้าไป" (ผ่าน Codegen Target ตาม §8) โดยไม่ผูก Business Logic ของโปรเจกต์ใดไว้ใน Core

### 2.2 Layered Architecture (ภายใน UI Engine)

```
┌─────────────────────────────────────────────────────────────────┐
│  L1  Presentation Layer                                            │
│      - Designer App (React 19 SPA): Canvas, Property Inspector,     │
│        Monaco JSON Editor                                           │
│      - Runtime Renderer (embeddable widget/package)                 │
├─────────────────────────────────────────────────────────────────┤
│  L2  API Layer (FastAPI)                                            │
│      - REST endpoints: /pages, /layouts, /components,               │
│        /codegen-targets, /resolvers                                 │
│      - Auth/RBAC middleware (ทุก request ผ่านชั้นนี้ก่อนเสมอ)          │
├─────────────────────────────────────────────────────────────────┤
│  L3  Domain / Application Layer                                     │
│      - PageService, LayoutService, ComponentRegistryService          │
│      - CodegenOrchestrationService (scan → generate → diff → apply) │
│      - Validation Layer (JSON Schema draft-2020-12)                  │
├─────────────────────────────────────────────────────────────────┤
│  L4  Resolver Layer (Security Boundary)                             │
│      - ResolverRegistry: whitelisted query functions เท่านั้น         │
│      - ไม่มี Raw SQL/eval หลุดออกจากชั้นนี้ได้                          │
├─────────────────────────────────────────────────────────────────┤
│  L5  Infrastructure Layer                                            │
│      - PostgreSQL (schema: ui_designer)                             │
│      - Redis (cache), RabbitMQ (event, ถ้าต้องเชื่อมระบบอื่น)         │
│      - OpenTelemetry (trace/metrics export)                         │
│      - Git-aware File Writer (สำหรับ Codegen เข้า Target Project)     │
└─────────────────────────────────────────────────────────────────┘
```

หลักการ: Request ไหลจากบนลงล่างเท่านั้น (L1→L5) ห้าม Layer บนข้าม Layer กลางไปเรียก Infrastructure ตรงๆ (เช่น Frontend ห้ามต่อ PostgreSQL ตรง, Domain Layer ห้ามข้าม Resolver Layer ไปรัน SQL เอง)

### 2.3 Request Flow — Runtime Rendering (โปรเจกต์อื่นดึง UI Engine ไปใช้)

```
Browser (Target Project's page)
   │  GET /api/render/{pageId}
   ▼
UI Engine API (L2) → LayoutService (L3) → โหลด layout_json จาก DB
   │
   ▼
ส่ง layout_json กลับให้ RenderEngineComponent (Frontend)
   │
   ▼
RenderEngineComponent แปลง JSON → React Elements ผ่าน Component Registry
   │  (ถ้ามี LOV ที่ต้องดึงข้อมูล)
   ▼
เรียก /api/resolve/{resolverKey} → ResolverRegistry (L4) → คืนข้อมูลจริง
```

### 2.4 Request Flow — Codegen เข้า Target Project

```
UI Engine Designer (ออกแบบหน้าจอเสร็จ)
   │  POST /codegen-targets/{id}/generate?dry_run=true
   ▼
CodegenOrchestrationService (L3)
   │
   ├─► ProjectScanner: อ่าน convention จาก TARGET_PROJECT_ROOT
   ├─► CodeGenerator: สร้างไฟล์ตาม layout_json + convention ที่สแกนได้
   └─► DiffBuilder: เทียบกับไฟล์เดิม (ถ้ามี) → สร้าง unified diff
   │
   ▼
ส่ง Diff กลับให้ผู้ใช้ Review ใน Designer UI
   │  (Human Approve)
   ▼
POST /codegen-targets/{id}/generate?dry_run=false&approved_by=<user>
   │
   ▼
Git-aware File Writer เขียนไฟล์จริงเข้า project_root/target_subpath
   (จำกัดด้วย allowed_write_globs เท่านั้น) + commit พร้อม message ระบุที่มา
```

### 2.5 Deployment Topology (แนะนำ)

```
┌───────────────────────────────┐
│  Docker Compose / K8s Namespace │
│                                  │
│  ┌───────────┐  ┌───────────┐   │
│  │ ui-engine-  │  │ ui-engine-  │   │
│  │ api (FastAPI│  │ designer    │   │
│  │  x N pods)  │  │ (static SPA)│   │
│  └─────┬─────┘  └───────────┘   │
│        │                          │
│  ┌─────┴─────┐  ┌───────────┐   │
│  │ PostgreSQL  │  │ Redis        │   │
│  │ (shared หรือ │  │              │   │
│  │  แยกก้อน)    │  │              │   │
│  └───────────┘  └───────────┘   │
│                                  │
│  Codegen Worker (separate pod    │
│  ที่มีสิทธิ์ mount TARGET_PROJECT_ROOT│
│  เป็น volume — แยกจาก api pod      │
│  เพื่อจำกัด Blast radius)            │
└───────────────────────────────┘
```

**สำคัญ:** Codegen Worker ที่มีสิทธิ์เขียนไฟล์เข้า Target Project ควรแยก Pod/Process ออกจาก API หลัก และ Mount เฉพาะ `TARGET_PROJECT_ROOT` ที่จำเป็น เพื่อไม่ให้ช่องโหว่ใน API Layer ลุกลามไปเขียนไฟล์ในระบบอื่นได้

### 2.6 Runtime Form State Lifecycle & Validation (Reactive)

ในโหมด Runtime (`UIRenderer.tsx` + `useRenderStore.ts`) ค่าที่ผู้ใช้กรอกต้องมี Lifecycle ที่พิจารณาได้ว่าฟอร์ม "พร้อม Submit" หรือไม่ ไม่ใช่แค่เก็บค่าไว้เฉย ๆ โมเดลแบบ Single Source of Truth อยู่ใน Zustand store แยกจาก `useUIStore` (ฝั่ง Designer)

```
                       useRenderStore (Runtime only)
            ┌───────────────────────────────────────────────┐
            │ formValues : Record<componentId, any>           │  ← broadcast target (§2.7)
            │ touched    : Record<componentId, boolean>        │  ← onBlur marks touched
            │ errors     : Record<componentId, string[]>       │  ← computed by formValidator
            │ submitState: 'idle' | 'validating' | 'ready'     │
            │            │  'submitting' | 'error'              │
            └───────────────────────────────────────────────┘
                       ▲                          │
                       │ setFieldValue(id, v)    │ getFormStatus()
                       │ markTouched(id)         │ → { isValid, canSubmit }
                       │                         ▼
            ┌──────────────────────┐    ┌─────────────────────┐
            │ UIRenderer (each     │    │ formValidator.ts    │
            │  bound component)   │    │  pure(layout, vals) │
            │  onChange → set      │    │  uses validation.*  │
            │  onBlur  → touched  │    │  from each component│
            └──────────────────────┘    └─────────────────────┘
```

**กฎของ Validation:**
- กฎมาจาก `layout_json` → `validation.{required,pattern,min,max,minLength,maxLength,customResolver}` (เพิ่มใน §5.2) เท่านั้น ห้าม Component เขียน Logic ฟิลด์ง่าย ๆ เองเพื่อให้ Agent พิจารณา/ปรับปรุง Schema ได้จากที่เดียว
- `formValidator` ใน `render-engine/validation/formValidator.ts` เป็น pure function: `(layout, formValues) => { valid: boolean, errors: Record<id, string[]> }` — ทำงานทั้งตอน `onChange` (debounced) และตอน `submitState → validating`
- `validation.customResolver` (เช่น regex แบบซับซ้อน/lookup uniqueness) ต้องไปผ่าน `RouterResolver` ฝั่ง backend (`/api/resolve/{resolverKey}`) เท่านั้น ห้าม eval/inline
- `UIRenderer.tsx` expose Provider `<RuntimeFormProvider layout={...}>` ที่ครอบและสร้าง instance ของ `useRenderStore` ใหม่เฉพาะที่ใช้ครอบเพจนั้น ทำให้ Render Engine embeddable ในหน้าเป้าหมายได้โดยไม่รั่ว State ข้ามเพจ (ผูกกับ Build Library Mode §3.4/§12)
- Submit Flow มีหลัก 3 ขั้น: `idle → validating → (valid? ready : error)` → `submitting` มี `onValidSubmit(payload)` callback ที่ Target Project ส่งเข้ามาใน props ของ `<UIRenderer>` — UI Engine เองไม่ส่ง HTTP request ธุรกิจทั้งหมด ทำให้ Engine ปลอด Business Logic ตามหลัก §1

### 2.7 Cascading LOV — Global Dynamic Context (Reactive Broadcast)

การส่งผ่านค่าระหว่าง Component (เช่น CountryLov → CityLovSelect) ใช้สถาปัตยกรรม **Global Dynamic Context** บน `useRenderStore.formValues` แทนการ wiring props ตรงระหว่าง Component 2 ตัว เพื่อให้ Agent ประกาศ dependency แบบ declarative ผ่าน `depends_on` (เพิ่มใน §5.2) ได้เลย

```
 1) CountryLov (id: comp_01) onChange → 'TH'
        │ useRenderStore.setFieldValue('comp_01','TH')
        ▼
 2) Zustand broadcast → formValues = { comp_01: 'TH', ... }
        │
        ├──► useDependsOn('comp_02') detects depends_on=['comp_01']
        │       subscriber re-runs selector: deps = { country: 'TH' }
        ▼
 3) useCascadeQuery (TanStack Query v5)
        │ queryKey  = ['resolve','province_by_country', { country }]
        │ → deps เปลี่ยน = queryKey เปลี่ยน = TanStack auto-refetch
        │ → cache เก่า(key เดิม) ยังอยู่เพื่อ instant backnav; gcTime จัดการ prune
        ▼
 4) CityLovSelect (id: comp_02) re-renders พร้อม option ใหม่ + reset ค่าเดิม
        (reset trigger เมื่อ parent value เปลี่ยน เพื่อกัน stale value ค้างใน formValues)
```

**กฎของ Cascading:**
- `useDependsOn(childId)` อ่าน `depends_on` จาก layout และสร้าง selector `(formValues) => pickedDeps` — Zustand จะ re-run successor เฉพาะเมื่อ deps ที่ pick มาเปลี่ยนจริง (shallow equality) ป้องกัน render storm
- `queryKey` ต้องฝัง `dep values` ทั้งหมดเข้าไป (`['resolve', resolverKey, paramsWithDeps]`) — ใช้กลไกของ TanStack ในการ invalidate อัตโนมัติเมื่อ key เปลี่ยน ไม่ต้องเรียก `queryClient.invalidateQueries` ด้วยมือ
- กรณีวิกฤต cache ที่ซับซ้อน (depth > 2, หรือต้องการรักษา cache cross-session) ใช้ Redis cache ฝั่ง Resolver (ดู §4.1) คีย์ด้วย hash(resolverKey+params) — ห้ามใส่ค่าใน URL path แบบ plain text หากเป็นข้อมูล sensitive
- ลำดับการ reset child value: เมื่อ parent value เปลี่ยน ให้ `useCascadeQuery` emit `onParentChange` → `useRenderStore.setFieldValue(childId, '')` + `markTouched(childId, false)` เพื่อกัน stale และกัน error message ค้างจาก validator
- ป้องกัน Cycle: `formValidator` + AST validator ฝั่ง backend ต้องตรวจ `depends_on` graph ว่าเป็น DAG เท่านั้น — ห้าม Component A → B → A (reject ตั้งแต่ JSON Schema validation phase เพื่อไม่ส่งต่อไป Runtime)

### 2.8 Universal Theme System (UT-inspired) & Theme Roller

เพื่อให้ผู้ใช้ที่ไม่ใช่ Developer สามารถ "เลือกหน้าตา" ของหน้าจอที่ Design ออกมาแล้วดูดีใช้งานได้จริง (โดยไม่ต้องเขียน CSS เอง) UI Engine จึงมีระบบ **Universal Theme** แบบเดียวกับ Oracle APEX Universal Theme (UT) ประกอบด้วย:

1. **Theme Catalog** — Theme เป็น "แพ็คเกจ" ที่บรรจุ Design Tokens (สี, ระยะ, typography, radius, shadow) และ Template Options ของแต่ละ Standard Component (เช่น `t-Button--noUI`, `t-Button--hot`, `t-Button--simple`) โดยมี Theme "หลัก" ของ EraOwl ชื่อ **EODS Universal Theme (EUT)** อิงกับ EraOwl Design System (§4.2) และเปิดให้เพิ่ม Custom Theme ได้ภายหลัง
2. **Theme Style** — "สไตล์ย่อย" ภายใน Theme เดียว (เช่นใน UT: `Vita`, `Vita - Slate`, `Vita - Red`) — เป็นค่า Token ที่ "ตั้งสำเร็จ" ผู้ใช้สามารถเลือกได้ทันที โดยไม่ต้องปรับแต่ง
3. **Theme Roller** — เครื่องมือลาก Slider/Color picker บน Designer เพื่อปรับ Token ตัวใดตัวหนึ่ง (เช่น `--eut-color-accent`, `--eut-radius-md`, `--eut-density`) สด ๆ แล้วเห็นผลทันทีบน Canvas สามารถ "Save as Theme Style" เก็บกลับเป็นสไตล์ใหม่ของ tenant นั้นได้
4. **Template Options** — แต่ละ Component ใน Registry ประกาศ "ตัวเลือกเชิงประกาศ" ที่เปลี่ยน Visual ได้โดยไม่ใช้ CSS ครอบ (เช่น Button component มี options `appearance: 'hot' | 'simple' | 'noUI' | 'danger'`, Region component มี `container: '卡片' | 'borderless' | 'collapsible'`) — ส่งผ่านลง `layout_json` แทน inline style
5. **Theme Binding on Layout** — Layout สามารถผูก `styleRef` (Theme Style id) ที่ระดับ page เพื่อให้ทุก Component ในหน้าใช้สไตล์เดียวกัน หรือ override ที่ component ระดับ region/component ได้

```
 ┌─────────────────────────────────────────────────────────────────────┐
 │   Theme Catalog (DB: ui_theme_catalog)                                 │
 │   ─ Theme "EODS Universal Theme (EUT)"                               │
 │     │ tokens: { --eut-color-bg, --eut-color-accent, --eut-radius, }│
 │     │ templateOptions: per Component type                            │
 │     │                                                                  │
 │     ├─ Theme Styles (DB: ui_theme_styles)                            │
 │     │   ├─ "Vita"        (preset tokens, is_default=true)              │
 │     │   ├─ "Vita - Slate"                                              │
 │     │   └─ "Custom 2026-Q3"  (tenant_id scoped, is_tenant=true)        │
 │     │                                                                  │
 │     └─ Tenant Overrides (DB: ui_theme_overrides) — Theme Roller edit   │
 │                                                                  │
 │      Theme Roller (Designer UI)                                  │
 │   ┌──────────────────────────────────────┐                       │
 │   │ Accent  [#3b82f6]██░  Density [●────]│  ← live preview via    │
 │   │ Radius  [────●]  Font   [Inter ▼]    │     CSS var injection │
 │   └──────────────────────────────────────┘                       │
 │           │ Save as Theme Style                                     │
 │           ▼                                                          │
 │   POST /api/themes/{id}/styles  → tenant override row               │
 │                                                                  │
 │      Layout (layout_json)                                        │
 │   { styleRef: "eut.vita-slate", regions: [...] }                   │
 │           │ render                                                  │
 │           ▼                                                          │
 │   <RuntimeThemeProvider styleRef=...>                              │
 │    inject via CSS var + per-component templateOptions               │
 │   └─► UIRenderer resolves tokens & Template Option classes          │
 └─────────────────────────────────────────────────────────────────────┘
```

**กฎของ Universal Theme System:**
- ทุกค่าที่เปลี่ยน Visual ต้อง "map" ผ่าน Design Token (CSS variable) ที่ declare ใน Theme Catalog — เพื่อให้ Theme Roller สามารถ override ได้ครบ ห้าม Component ใช้ literal color/spacing ที่ hardcoded ใน tsx
- Template Options ที่ `componentRegistry` ประกาศ ต้องเป็นแบบ `enum`/`boolean` (declarative) เท่านั้น — ห้ามรับ raw CSS string ที่จะทำให้ Theme override ไม่ได้ และเสี่ยง XSS
- Theme Style ใหม่ที่สร้างด้วย Theme Roller ที่ tenant สร้างเอง ต้องเก็บเฉพาะ **delta tokens** (ที่ override จาก parent Style) ใน `ui_theme_overrides` เพื่อให้ update Theme แม่แล้ว child ยังสืบทอดได้
- Theme ที่เลือก (styleRef) จะส่งผ่าน `<RuntimeThemeProvider>` (คล้าย `RuntimeFormProvider` ใน §2.6) — Provider แยกออกจาก `UIRenderer` เพื่อให้ข้อมูล Style สามารถ fetch จาก `/api/themes/{styleRef}` ครั้งเดียวและนำไป inject เป็น CSS variable ที่ root container (scoped ตาม scope-attribute เพื่อไม่กัดกับหน้า host ของ Target project)
- `styleRef` ของ page สามารถ override ที่ region/component ได้ด้วยการระบุ `styleRef` ใน component level — เพื่อรองรับกรณี "Accent button เด่นบนหน้า Neutral" แต่ลำดับความสำคัญคือ `component.styleRef > page.styleRef > tenant default style`
- Theme tokens ที่ Library Mode (Target B) ใช้ต้องส่งออกเป็น standalone CSS เฉพาะ scope (`eraowl-ui-engine.css` + scoped `[data-eut-theme="..."]`) เพื่อไม่ทำให้ style ของ Target project กระเพื่อม
- Theme data ที่ฝั่ง Runtime ไม่ต้อง secure เท่า layout_json แต่ต้อง validate ด้วย Theme JSON Schema (§5.3) ทุกครั้งก่อน publish — เพื่อกันโทเคนหายไปแล้ว Render crash

---

## 3. Project Structure

### 3.1 Backend Repository (`eraowl-ui-engine-api`)

```
eraowl-ui-engine-api/
├── app/
│   ├── main.py                        # FastAPI entrypoint
│   ├── core/
│   │   ├── config.py                  # Settings (pydantic-settings), env vars
│   │   ├── security.py                # JWT decode, RBAC dependency (require_role)
│   │   ├── telemetry.py               # OpenTelemetry setup
│   │   └── db.py                      # Async engine/session factory
│   │
│   ├── modules/
│   │   └── ui_designer/
│   │       ├── models.py              # SQLModel: Page, PageLayout, CodegenTarget
│   │       ├── schemas.py             # Pydantic request/response DTOs
│   │       ├── service.py             # PageService, LayoutService
│   │       ├── router.py              # /pages, /layouts endpoints
│   │       │
│   │       ├── resolvers/
│   │       │   ├── registry.py        # ResolverRegistry (§6.1)
│   │       │   └── builtin/           # Resolver ที่ Register ไว้ล่วงหน้า
│   │       │       └── province_by_country.py
│   │       │
│   │       ├── components/
│   │       │   ├── registry.py        # Component Prop Schema registry (backend mirror)
│   │       │   └── schemas/           # JSON Schema ต่อ component type
│   │       │       ├── region.schema.json
│   │       │       ├── lov.schema.json
│   │       │       └── lov_select.schema.json
│   │       │
│   │       └── codegen/
│   │           ├── config.py          # CodegenTargetConfig (§8.3)
│   │           ├── scanner.py         # ProjectScanner (§8.4)
│   │           ├── generator.py       # CodeGenerator — render template → ไฟล์จริง
│   │           ├── diff_builder.py    # unified diff builder
│   │           ├── writer.py          # Git-aware sandboxed file writer
│   │           └── router.py          # /codegen-targets endpoints
│   │
│   ├── schema_validation/
│   │   ├── layout_schema_v1.json      # JSON Schema draft-2020-12 (§5.2)
│   │   └── validator.py               # wrap `jsonschema` lib
│   │
│   └── shared/
│       ├── base_crud.py               # BaseCRUDService (soft-delete)
│       └── exceptions.py
│
├── db/
│   └── migrations/                    # dbmate migration files (versioned .sql)
│       ├── 20260101000000_init_ui_designer_schema.sql
│       └── 20260102000000_add_codegen_targets.sql
│
├── tests/
│   ├── unit/
│   │   ├── test_resolver_registry.py
│   │   ├── test_layout_schema_validation.py
│   │   └── test_project_scanner.py
│   └── integration/
│       ├── test_pages_api.py
│       └── test_codegen_sandbox.py    # ทดสอบว่าเขียนไฟล์นอก allowed_write_globs ต้อง block
│
├── pyproject.toml
├── dbmate.yml
└── docker-compose.yml
```

### 3.2 Frontend Repository (`eraowl-ui-engine-web`)

```
eraowl-ui-engine-web/
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── router.tsx
│   │   └── providers.tsx              # TanStack Query, Zustand provider wrapper
│   │
│   ├── designer/
│   │   ├── canvas/
│   │   │   ├── DesignerCanvas.tsx
│   │   │   └── DragDropLayer.tsx
│   │   ├── inspector/
│   │   │   ├── PropertyInspector.tsx
│   │   │   └── TemplateOptionsPanel.tsx # declarative enum/bool options per component type (§2.8)
│   │   ├── theme/
│   │   │   ├── ThemeRoller.tsx          # live Theme Roller UI — slider/color picker + preview (§2.8)
│   │   │   ├── ThemeStylePicker.tsx     # เลือก Theme Style preset (Vita, Vita - Slate, ...)
│   │   │   └── useThemeRollerStore.ts    # draft token override state (Zustand + zundo undo/redo)
│   │   └── editor/
│   │       └── MonacoJsonEditor.tsx
│   │
│   ├── render-engine/
│   │   ├── UIRenderer.tsx             # Interpreter หลัก
│   │   ├── registry/
│   │   │   └── componentRegistry.ts   # Registry object (declare templateOptions per type, §2.8)
│   │   ├── components/
│   │   │   ├── Region.tsx
│   │   │   ├── Lov.tsx
│   │   │   └── LovSelect.tsx
│   │   ├── theme/
│   │   │   ├── RuntimeThemeProvider.tsx # inject CSS vars scoped [data-eut-theme] (§2.8)
│   │   │   ├── tokenResolver.ts        # resolve cascade page→component styleRef → tokens
│   │   │   ├── templateOptionClasses.ts # map enum options → class names
│   │   │   └── tokenTypes.ts           # TS types for Token/ThemeStyle/TemplateOption
│   │   ├── hooks/
│   │   │   ├── useFormState.ts        # aggregate formValues + touched + errors lifecycle (§2.6)
│   │   │   ├── useDependsOn.ts        # reactive depends_on subscription + cache invalidation (§2.7)
│   │   │   ├── useCascadeQuery.ts     # TanStack Query wrapper bound to formValues
│   │   │   ├── useThemeStyle.ts       # fetch + cache Theme Style via TanStack Query (§2.8)
│   │   │   └── useResolvedTokens.ts   # return effective merged token object for current context
│   │   └── validation/
│   │       └── formValidator.ts       # pure fn — รับ layout_json + formValues คืน {valid, errors}
│   │
│   ├── store/
│   │   ├── useUIStore.ts              # Zustand + zundo (undo/redo) — Designer state
│   │   ├── useRenderStore.ts          # Runtime state: formValues/touched/errors + broadcast (§2.6, §2.7)
│   │   └── useCodegenStore.ts         # state สำหรับ diff preview/approve flow
│   │
│   ├── api/
│   │   ├── client.ts                  # axios/fetch wrapper + auth header
│   │   ├── pages.ts
│   │   ├── layouts.ts
│   │   ├── codegenTargets.ts
│   │   └── themes.ts                  # /api/themes CRUD + Theme Style picker (§2.8)
│   │
│   ├── schemas/
│   │   ├── layoutSchema.ts            # ajv compiled schema (client-side validation)
│   │   └── themeSchema.ts             # ajv compiled Theme JSON Schema (§5.3)
│   │
│   ├── themes/                          # built-in Theme Catalog artifacts (versioned with repo)
│   │   ├── eut/                          # EODS Universal Theme (EUT) — default Theme
│   │   │   ├── tokens.base.json          # base token definitions (default values)
│   │   │   ├── templateOptions.json      # per-component-type template option catalog
│   │   │   └── styles/                   # built-in Theme Style presets (token deltas)
│   │   │       ├── vita.json
│   │   │       ├── vita-slate.json
│   │   │       └── vita-red.json
│   │   └── index.ts                     # themeLoader(themes: ThemeId) → Theme bundle (lazy)
│   │
│   └── styles/
│       ├── eods-tokens.css            # EraOwl Design System CSS variables (legacy, raw tokens)
│       └── eut-runtime.css            # EUT library-scoped output: [data-eut-theme="..."] token injections (Target B §3.4)
│
├── tests/
│   ├── unit/                          # Vitest
│   └── e2e/                           # Playwright
│
├── package.json                       # exports 2 ชุด: "designer" app + "eraowl-ui-engine" library (§3.4)
├── tailwind.config.ts
├── vite.config.ts                      # multi-target build (§3.4): mode=designer | mode=lib
└── vite.lib.config.ts                  # isolated build profile สำหรับ Library Mode (tree-shake, no index.html)
```

### 3.3 Target Project — โฟลเดอร์ที่ Codegen จะแตะ (ตัวอย่าง `/u01/eraowl-ops`)

```
/u01/eraowl-ops/                       # ← TARGET_PROJECT_ROOT
├── apps/
│   └── web/
│       └── src/
│           ├── pages/
│           │   ├── generated/          # ← ALLOWED (Codegen เขียนได้)
│           │   │   └── purchase-order-list.tsx
│           │   └── manual/             # ← ห้ามแตะ (โค้ดที่ทีมเขียนเอง)
│           └── components/
│               ├── generated/          # ← ALLOWED
│               └── shared/             # ← ห้ามแตะ
├── apps/api/                          # ← ห้ามแตะทั้งหมด (Business logic เดิม)
└── db/migrations/                     # ← ห้ามแตะ (ใช้ migration tool ของ Target เอง)
```

**กฎ:** Codegen แตะได้เฉพาะ Path ที่ตรงกับ `allowed_write_globs` เท่านั้น (ตัวอย่างข้างบนคือ `apps/web/src/pages/generated/**` และ `apps/web/src/components/generated/**`) — ไฟล์ใน `manual/`, `shared/`, `apps/api/`, `db/migrations/` ของ Target ถือเป็นเขตหวงห้ามเสมอ

### 3.4 Frontend Dual Build Target — Designer Application vs Library Mode

> หัวข้อนี้เป็นการขยายต่อจาก §3.2 (Frontend Repository) เกี่ยวกับ Output ของ Build — วางถัดจาก §3.3 เพื่อให้ Agent อ่านโครงสร้างโฟลเดอร์ Target Project และ Build target ครบถ้วน

โครงสร้างใน `eraowl-ui-engine-web` ต้อง Build ออกได้สองโหมดเพื่อให้เป็น "เครื่องมือกลาง" ตามหลัก §1 Decoupled Core:

| | Target A — Designer Application | Target B — Library Mode (Runtime Engine) |
|---|---|---|
| ผู้ใช้ | Admin / Designer (ทีม EraOwl) | Target Project (เช่น AXON WMS, EraOwl-OPS) |
| Output | Static SPA เต็มรูป (`dist/designer/`) | `dist/eraowl-ui-engine/` เป็น ESM + UMD bundle + Theme assets |
| ข้างใน | `src/main.tsx`, Designer, Monaco editor, `useUIStore` | `src/render-engine/**` + `src/store/useRenderStore.ts` + `src/themes/eut/**` + peer deps |
| Entry | `index.html` → `'./src/main.tsx'` | `package.json` `exports['.']`: `import { UIRenderer, RuntimeFormProvider, RuntimeThemeProvider } from 'eraowl-ui-engine'` |
| Provider | มี Codegen Store, router, API client ฝั่ง designer | มี Min API surface ที่ Target project เชื่อมเอง (props: `layoutJson`, `onValidSubmit()`, `token`, `resolveBaseUrl`, `registry.registerTheme(bundle)` สำหรับ Custom Theme, §2.8) |

**Vite multi-target — ข้อกำหนดในไฟล์ `vite.config.ts` + `vite.lib.config.ts`:**

```ts
// vite.config.ts — ตัวอย่างโครง (Agent ต้องเติม plugin detail ตาม Tech Stack §4.2)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const MODE = process.env.BUILD_MODE ?? 'designer'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: MODE === 'designer'
    ? { outDir: 'dist/designer', sourcemap: true }              // Target A: full SPA
    : undefined,                                                 // lib mode handled by vite.lib.config.ts
}))
```

```ts
// vite.lib.config.ts — Target B: Library Mode (run via `BUILD_MODE=lib vite build --config vite.lib.config.ts`)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({ entryRoot: 'src/render-engine', include: ['src/render-engine/**','src/store/useRenderStore.ts','src/themes/index.ts'] }),
    // copy static theme assets (eut-runtime.css + Style presets) ไป dist/eraowl-ui-engine/themes/eut/** (§2.8)
    // ใช้ vite-plugin-static-copy หรือ rollupOptions input assets
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/render-engine/index.ts'),  // public entry of library
      name: 'EraOwlUIEngine',
      formats: ['es', 'umd'],
      fileName: (fmt) => `eraowl-ui-engine.${fmt}.js`,
    },
    rollupOptions: {
      external: ['react','react-dom','react/jsx-runtime','zustand','@tanstack/react-query'],
      output: { globals: { react: 'React', 'react-dom': 'ReactDOM' } },
    },
    sourcemap: true,
    emptyOutDir: false,                                          // อย่าลบ dist/designer ที่ built ไว้ก่อนหน้า
    outDir: 'dist/eraowl-ui-engine',
  },
})
```

**`src/render-engine/index.ts` — public API surface ที่ Library mode export:**
```ts
export { UIRenderer } from './UIRenderer'
export { RuntimeFormProvider } from './RuntimeFormProvider'         // wrap + create useRenderStore instance
export { RuntimeThemeProvider } from './theme/RuntimeThemeProvider' // inject Theme tokens scoped (§2.8)
export { useFormState } from './hooks/useFormState'
export { useCascadeQuery } from './hooks/useCascadeQuery'
export { useThemeStyle } from './hooks/useThemeStyle'               // fetch+cache Theme Style (§2.8)
export { resolveTokens } from './theme/tokenResolver'               // compute effective tokens (page→component)
export type { LayoutJson, ComponentProps, FormStatus, ThemeBundle, ThemeStyle, Token } from './types'
export { componentRegistry } from './registry/componentRegistry'   // ให้ Target project ลงทะเบียน Custom component เพิ่มได้
export { registerTheme } from '../themes'                          // ให้ Target project ลงทะเบียน Custom Theme เพิ่ม (§2.8)
```

**Theme assets in Library build (§2.8):**
- `eut-runtime.css` (built from `src/themes/eut/tokens.base.json` + Style deltas ด้วย `scripts/build-theme-css.ts`, §7 Phase 2.5) ถูก copy ไป `dist/eraowl-ui-engine/themes/eut/eut-runtime.css` — Target project import เอาเองใน root layout (`import 'eraowl-ui-engine/themes/eut/eut-runtime.css'`)
- Built-in Style presets (`vita.json`, `vita-slate.json`, `vita-red.json`) bundled เข้า library output ใต้ `dist/eraowl-ui-engine/themes/eut/styles/*` เพื่อให้ offline-default ใช้ได้ทันทีโดยไม่ต้อง fetch `/api/themes`
- `registerTheme(bundle: ThemeBundle)` API สำหรับให้ Target project ลงทะเบียน Custom Theme ที่ตนเองสร้าง (token set + templateOptions) ลงใน runtime registry — ทำให้ Engine ไม่ผูกกับ Theme เฉพาะ EraOwl อย่างเดียว

**`package.json` — exports map (ผูกกับ §3.4):**
```json
{
  "name": "eraowl-ui-engine",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/eraowl-ui-engine/eraowl-ui-engine.umd.js",
  "module": "./dist/eraowl-ui-engine/eraowl-ui-engine.es.js",
  "types": "./dist/eraowl-ui-engine/index.d.ts",
  "files": ["dist/eraowl-ui-engine", "README.md"],
  "exports": {
    ".": {
      "types": "./dist/eraowl-ui-engine/index.d.ts",
      "import": "./dist/eraowl-ui-engine/eraowl-ui-engine.es.js",
      "require": "./dist/eraowl-ui-engine/eraowl-ui-engine.umd.js"
    },
    "./themes/eut/eut-runtime.css": "./dist/eraowl-ui-engine/themes/eut/eut-runtime.css",
    "./themes/eut/styles/*": "./dist/eraowl-ui-engine/themes/eut/styles/*"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0"
  },
  "scripts": {
    "build": "npm run build:theme-css && BUILD_MODE=designer vite build && BUILD_MODE=lib vite build --config vite.lib.config.ts",
    "build:designer": "BUILD_MODE=designer vite build",
    "build:lib":      "BUILD_MODE=lib      vite build --config vite.lib.config.ts",
    "build:theme-css":"tsx scripts/build-theme-css.ts"
  }
}
```

**กฎสำคัญของ Build/Vendor:**
- Library Mode ประกาศ `react`, `react-dom`, `zustand`, `@tanstack/react-query` เป็น `peerDependencies` + `rollupOptions.external` — ห้าม bundle React ซ้ำเข้าไปในไฟล์ Library Output เพราะจะทำให้เกิด "Two Reacts" และ hook crash ใน Target Project
- ทุก API client ฝั่ง Designer (axios/fetch wrapper, Codegen store) ต้องอยู่นอก `src/render-engine/` — Target B ต้อง Build ออกมาแล้ว leak ไม่ได้ขึ้นติดกับ Endpoint/UI Engine API ฝั่ง designer เลย; Runtime document เรียก Resolver ผ่าน props `resolveBaseUrl` ที่รับมาจากผู้ใช้ Library
- `useRenderStore` และ `formValidator` เป็น pure JS/Zustand ไม่มี dependency เข้า `@dnd-kit`, Monaco, Designer — ให้ผ่าน constraint ของ `tsconfig.lib.json` (path-alias exclude `src/designer/**` + ESLint `no-restricted-imports`)
- งาน Designer ใช้ Tailwind ตรง runtime ได้; Library เอาโทเคน EODS ออกเป็น standalone CSS `eraowl-ui-engine.css` (extract) import ที่ Target project เองเพื่อไม่กัดกับ Tailwind setup ของเขา
- Theme CSS output (`eut-runtime.css`) ต้อง build เป็น step แยก (`build:theme-css`) ก่อน Library build เสมอ — เพราะ Library build จะ copy ไฟล์นี้เข้า dist ตามที่ `package.json` exports ประกาศไว้ (§2.8)
- CI (§4.4) ต้อง build ทั้งสองโหมดผ่านทุก PR + เช็คว่า `dist/eraowl-ui-engine/*.d.ts` ไม่ export symbol ที่ละเมิดหลักนี้ และ `dist/eraowl-ui-engine/themes/eut/eut-runtime.css` มีอยู่จริง

---

## 4. Tech Stack

### 4.1 Backend
| Layer | เลือกใช้ | เหตุผล |
|---|---|---|
| Language | Python ≥3.12 | Type hints, performance improvements |
| Framework | FastAPI ≥0.118 + Pydantic v2.10+ | Stable async, type-safe |
| ORM | SQLModel ≥0.0.24 (async only) | ใช้ร่วมกับ Pydantic validation ได้ตรงตัว |
| DB Driver | asyncpg 0.30+ (หรือ psycopg3 ถ้า Target Project เดิมใช้อยู่แล้ว) | เลือกตาม Target Project เพื่อลด Operational overhead |
| Migration | **dbmate** | Versioned `.sql`, ใช้ร่วมกับมาตรฐานเครือ EraOwl |
| Cache/Queue | Redis 7.x (+ RabbitMQ ถ้าต้องเชื่อม Event กับระบบอื่น) | Cache Cascading LOV, รองรับ Event-driven ในอนาคต |
| Observability | OpenTelemetry (traces + metrics, OTLP exporter) | ตรวจสอบ Codegen pipeline และ API ได้ครบ |
| Schema Validation | `jsonschema` (draft-2020-12) | Validate `layout_json` แบบ Explicit ฝั่ง Server |
| Auth | OAuth2/JWT (Keycloak ถ้ามีในเครืออยู่แล้ว) + RBAC dependency | ผูกทุก Endpoint ตั้งแต่ Phase 0 |
| Testing | Pytest + pytest-asyncio + httpx | Unit + Integration |
| Lint/Format | Ruff + mypy (strict mode สำหรับ `codegen/` module) | Type safety สูงสุดในส่วนที่เขียนไฟล์ลงดิสก์จริง |

### 4.2 Frontend
| Layer | เลือกใช้ | เหตุผล |
|---|---|---|
| Framework | React 19 | Concurrent features |
| Build Tool | Vite 6.x | Dev server เร็ว, HMR ดี |
| Styling | Tailwind CSS 4.x + EODS Design Tokens (CSS vars) | คงมาตรฐาน EraOwl Design System |
| State | Zustand ^5.0.0 + `zundo` (undo/redo) | Design Tool ต้องมี Undo/Redo ใช้งานจริง |
| Data Fetching | TanStack Query v5 (`staleTime`/`gcTime` ตั้งแต่ต้น) | Cache Cascading LOV |
| Drag & Drop | `@dnd-kit/core` | Maintained, accessible, ดีกว่า react-dnd รุ่นเก่า |
| Schema Editor | Monaco Editor + `ajv` (client-side JSON Schema validation) | Validate ก่อนส่งขึ้น Backend |
| Sanitization | `DOMPurify` | ป้องกัน XSS จาก Config ที่ผู้ใช้กรอก |
| Testing | Vitest + React Testing Library + Playwright (E2E) | Unit → E2E ครบ |

### 4.3 Codegen / Project Integration
| Layer | เลือกใช้ | เหตุผล |
|---|---|---|
| Project Scanner | AST-based: `ast` (Python) / `ts-morph` หรือ Babel AST (TS/JS) | อ่าน Convention เดิมของ Target Project แบบแม่นยำ ไม่ใช่ Regex เดา |
| Template Engine | Jinja2 (สำหรับ backend code) / string-template + Prettier post-format (สำหรับ TSX) | แยก Template ออกจาก Logic ชัดเจน |
| File Writer | Git-aware writer (เขียนผ่าน Git working tree, ไม่ patch ไฟล์ตรงๆ) | ให้ Diff/Review/Rollback ได้เสมอ |
| Diff Format | Unified diff (`difflib` / `git diff --no-index`) | มาตรฐานที่ Human review ได้ง่าย |
| Migration Tool ใน Target | ใช้ตัวเดียวกับที่ Target Project ใช้อยู่ (detect จาก config) | ไม่ยัด dbmate เข้าไปทับ Target ที่ใช้เครื่องมืออื่นอยู่ |

### 4.4 Infra / DevOps
| Layer | เลือกใช้ | เหตุผล |
|---|---|---|
| Container | Docker Compose (dev) / K8s (prod) | Join network เดียวกับ AXON WMS ได้ถ้าจำเป็น |
| CI | GitHub Actions | Unit test + lint ต้องผ่านก่อน merge (บังคับ ไม่ Buffer) |
| Secrets | Vault หรือ K8s Secrets (ห้าม hardcode JWT secret/DB conn string) | |
| Codegen Worker | แยก Pod/Process จาก API หลัก (§2.5) | จำกัด Blast radius ของสิทธิ์เขียนไฟล์ |

---

## 5. Database & JSON Schema

### 5.1 PostgreSQL Schema (DDL)

```sql
-- schema: ui_designer
CREATE SCHEMA IF NOT EXISTS ui_designer;

CREATE TABLE ui_designer.ui_pages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       TEXT NOT NULL,
    page_name       TEXT NOT NULL,
    description     TEXT,
    schema_version  TEXT NOT NULL DEFAULT '1.0.0',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ui_designer.ui_page_layouts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id         UUID NOT NULL REFERENCES ui_designer.ui_pages(id) ON DELETE CASCADE,
    layout_json     JSONB NOT NULL,
    is_published    BOOLEAN NOT NULL DEFAULT false,
    created_by      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registry ของ Resolver ที่อนุญาตให้เรียกได้ (audit trail — โค้ดจริงอยู่ใน ResolverRegistry ฝั่ง backend)
CREATE TABLE ui_designer.ui_resolver_catalog (
    resolver_key    TEXT PRIMARY KEY,
    description     TEXT NOT NULL,
    param_schema    JSONB NOT NULL,        -- JSON Schema ของ params ที่ resolver รับ
    registered_by   TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registry ของ Component ที่ใช้ใน Designer ได้ (audit trail คู่กับ Frontend Component Registry)
CREATE TABLE ui_designer.ui_component_catalog (
    component_type    TEXT PRIMARY KEY,      -- 'Region' | 'Lov' | 'LovSelect' | ...
    prop_schema       JSONB NOT NULL,        -- Allowlist ของ props ที่ component รับ
    template_options  JSONB NOT NULL DEFAULT '{}',  -- Declarative enum/bool options per type (§2.8)
    is_custom         BOOLEAN NOT NULL DEFAULT false,
    registered_by     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Theme Catalog (UT-inspired): Theme = bundle of tokens + per-component templateOptions (§2.8)
CREATE TABLE ui_designer.ui_theme_catalog (
    theme_id        TEXT PRIMARY KEY,        -- 'eut' (EODS Universal Theme) | custom tenant theme
    tenant_id       TEXT,                    -- NULL = global built-in theme, NOT NULL = tenant-scoped
    display_name    TEXT NOT NULL,
    description     TEXT,
    base_tokens     JSONB NOT NULL,          -- full token definitions: colors, spacing, radius, typography, shadows, density
    template_options JSONB NOT NULL,         -- per-component-type declarative option catalog
    is_default      BOOLEAN NOT NULL DEFAULT false,
    is_active        BOOLEAN NOT NULL DEFAULT true,
    schema_version   TEXT NOT NULL DEFAULT '1.0.0',
    created_by       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Theme Style: pre-set delta tokens ภายใต้ theme เดียว (เช่น 'eut.vita', 'eut.vita-slate') (§2.8)
CREATE TABLE ui_designer.ui_theme_styles (
    style_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id        TEXT NOT NULL REFERENCES ui_designer.ui_theme_catalog(theme_id) ON DELETE CASCADE,
    tenant_id       TEXT,                    -- NULL = built-in style, NOT NULL = tenant-scoped preset
    style_key      TEXT NOT NULL,            -- 'vita' | 'vita-slate' | 'custom-2026q3'
    display_name    TEXT NOT NULL,
    delta_tokens    JSONB NOT NULL,          -- เก็บเฉพาะ tokens ที่ override จาก base_tokens (delta only)
    is_default      BOOLEAN NOT NULL DEFAULT false,
    created_by      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (theme_id, tenant_id, style_key)
);

-- Theme Roller live edits — tenant ปรับ tokens สด ๆ แล้ว Save as Theme Style (§2.8)
CREATE TABLE ui_designer.ui_theme_overrides (
    override_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id        TEXT NOT NULL REFERENCES ui_designer.ui_theme_catalog(theme_id) ON DELETE CASCADE,
    style_id        UUID REFERENCES ui_designer.ui_theme_styles(style_id) ON DELETE CASCADE,
    tenant_id       TEXT NOT NULL,
    token_path      TEXT NOT NULL,           -- path เช่น 'color.accent' → mapped ใน tokenResolver
    token_value     JSONB NOT NULL,          -- value (string|number|boolean)
    created_by      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ผูก Layout กับ Target Project ที่จะ Gen โค้ดเข้าไป
CREATE TABLE ui_designer.ui_page_codegen_targets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id             UUID NOT NULL REFERENCES ui_designer.ui_pages(id) ON DELETE CASCADE,
    project_root        TEXT NOT NULL,        -- เช่น '/u01/eraowl-ops'
    target_subpath      TEXT NOT NULL,        -- เช่น 'apps/web/src/pages/generated'
    allowed_write_globs TEXT[] NOT NULL,      -- Whitelist path patterns
    framework_detected  TEXT,                 -- 'nextjs' | 'vite-react' | 'fastapi' ฯลฯ
    last_scanned_at     TIMESTAMPTZ,
    last_generated_at   TIMESTAMPTZ,
    last_commit_sha     TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Log ทุกครั้งที่มีการ generate (dry-run และ apply จริง) เพื่อ audit
CREATE TABLE ui_designer.ui_codegen_runs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codegen_target_id   UUID NOT NULL REFERENCES ui_designer.ui_page_codegen_targets(id) ON DELETE CASCADE,
    dry_run             BOOLEAN NOT NULL,
    diff_summary        TEXT,
    files_changed       TEXT[],
    approved_by         TEXT,
    status              TEXT NOT NULL DEFAULT 'pending', -- pending | approved | applied | rejected
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ui_page_layouts_json  ON ui_designer.ui_page_layouts USING GIN (layout_json);
CREATE INDEX idx_ui_pages_tenant       ON ui_designer.ui_pages (tenant_id);
CREATE INDEX idx_codegen_runs_target   ON ui_designer.ui_codegen_runs (codegen_target_id);
CREATE INDEX idx_ui_theme_styles_lookup ON ui_designer.ui_theme_styles (theme_id, tenant_id);
CREATE INDEX idx_ui_theme_overrides_lookup ON ui_designer.ui_theme_overrides (theme_id, style_id, tenant_id);
CREATE UNIQUE INDEX uq_ui_theme_catalog_default ON ui_designer.ui_theme_catalog (theme_id) WHERE is_default;
```

Migration ทั้งหมดจัดการผ่าน `dbmate migrate` — ห้าม Manual DDL ใน Production

### 5.2 JSON Schema — `layout_json` (draft-2020-12, ย่อ)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://eraowl.dev/schemas/layout-v1.json",
  "title": "EraOwl UI Layout Schema v1",
  "type": "object",
  "required": ["schemaVersion", "regions"],
  "properties": {
    "schemaVersion": { "type": "string", "const": "1.0.0" },
    "styleRef": {
      "type": "string",
      "pattern": "^[a-z0-9_-]+\\.[a-z0-9_-]+$",
      "description": "Theme Style binding '{theme_id}.{style_key}' ใช้สำหรับ page ทั้งหน้า — ทุก component สืบทอด tokens (§2.8) เช่น 'eut.vita-slate'"
    },
    "regions": {
      "type": "array",
      "items": { "$ref": "#/$defs/region" }
    }
  },
  "$defs": {
    "region": {
      "type": "object",
      "required": ["id", "title", "components"],
      "properties": {
        "id": { "type": "string" },
        "title": { "type": "string" },
        "components": {
          "type": "array",
          "items": { "$ref": "#/$defs/component" }
        }
      }
    },
    "component": {
      "type": "object",
      "required": ["id", "type", "position"],
      "properties": {
        "id": { "type": "string" },
        "type": { "enum": ["Region", "Lov", "LovSelect"] },
        "position": {
          "type": "object",
          "required": ["x", "y", "width", "height"],
          "properties": {
            "x": { "type": "integer", "minimum": 0 },
            "y": { "type": "integer", "minimum": 0 },
            "width": { "type": "integer", "minimum": 1 },
            "height": { "type": "integer", "minimum": 1 }
          }
        },
        "styleRef": {
          "type": "string",
          "pattern": "^[a-z0-9_-]+\\.[a-z0-9_-]+$",
          "description": "Override Theme Style เฉพาะ component นี้ (สูงกว่า page.styleRef, §2.8)"
        },
        "templateOptions": {
          "type": "object",
          "description": "Declarative enum/boolean options per component type (utin Template Options, §2.8) — โครงสร้าง valid ตาม ui_component_catalog.template_options",
          "additionalProperties": { "type": ["string", "boolean", "number"] }
        },
        "styles": {
          "type": "object",
          "properties": {
            "fontSize": { "type": "string", "pattern": "^[0-9]+(px|rem)$" },
            "fontColor": { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" }
          },
          "additionalProperties": false
        },
        "depends_on": {
          "type": "array",
          "items": { "type": "string" },
          "description": "ID ของ component เป็น dependency; เมื่อเป้าหมายเปลี่ยนค่า จะ broadcast ไปยัง comp นี้และ invalidate TanStack cache (§2.7)"
        },
        "dataSource": {
          "type": "object",
          "required": ["dataSourceRef", "dataSourceType"],
          "properties": {
            "dataSourceRef": { "type": "string" },
            "dataSourceType": { "enum": ["REGISTERED_QUERY"] },
            "params": { "type": "object" }
          },
          "additionalProperties": false
        },
        "validation": {
          "type": "object",
          "properties": {
            "required": { "type": "boolean" },
            "pattern": { "type": "string" },
            "min": { "type": "number" },
            "max": { "type": "number" },
            "minLength": { "type": "integer", "minimum": 0 },
            "maxLength": { "type": "integer", "minimum": 0 },
            "customResolver": { "type": "string", "description": "resolverKey ผ่าน ResolverRegistry เท่านั้น" }
          },
          "additionalProperties": false
        },
        "formBinding": {
          "type": "object",
          "properties": {
            "field": { "type": "string", "description": "ชื่อฟิลด์ใน payload ที่จะส่ง Submit (default = id)" },
            "subscribesToForm": { "type": "boolean", "description": "true = ถูกเก็บใน useRenderStore.formValues" }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    }
  }
}
```

**กฎสำคัญของ Schema นี้:**
- `dataSourceType` มีค่าเดียวคือ `REGISTERED_QUERY` — ปิดโอกาสฟิลด์ Raw SQL ตั้งแต่ระดับ Schema (ไม่ใช่แค่ระดับ Convention)
- `additionalProperties: false` ทุกจุดสำคัญ — ป้องกัน Agent หรือ User แอบใส่ Field แปลกปลอมที่ไม่ผ่าน Validation
- Component `type` เป็น `enum` ปิด — ต้องเพิ่มใน `ui_component_catalog` (§5.1) ก่อนถึงจะใช้ type ใหม่ได้
- `validation.*` คือข้อกำหนดเชิงประกาศ (declarative) — UIRenderer.tsx ดึงไปใช้ฟอร์ม Validation อัตโนมัติ ไม่ใช่ Logic ฝังใน Component ตัวใดตัวหนึ่ง (ดู §2.6)
- `validation.customResolver` ต้องชี้ไปยัง `resolverKey` ใน ResolverRegistry เท่านั้น — ห้าม inline/eval
- `styleRef` (ระดับ page และระดับ component) ต้องตรงกับรูปแบบ `{theme_id}.{style_key}` — เมื่อ runtime จะ resolve tokens ตามลำดับ `component.styleRef > page.styleRef > tenant default` (§2.8)
- `templateOptions` เป็น declarative options เท่านั้น — keys ต้องอยู่ใน allowlist ของ `ui_component_catalog.template_options` ตาม `type` ของ component นั้น; ห้ามใช้เป็นทางลัดส่ง raw CSS/HTML เข้า Runtime (Security ผูกกับ §6.4)

### 5.3 Theme JSON Schema — `theme_bundle` (draft-2020-12, ย่อ)

เอกสารกำกับ Theme Catalog + Style ใช้ Schema เดียวกันฝั่ง BE (`jsonschema`) และ FE (`ajv`, `src/schemas/themeSchema.ts`):

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://eraowl.dev/schemas/theme-v1.json",
  "title": "EraOwl Theme Bundle v1",
  "type": "object",
  "required": ["themeId", "tokens", "templateOptions"],
  "properties": {
    "themeId":      { "type": "string", "pattern": "^[a-z0-9_-]+$" },
    "displayName":  { "type": "string" },
    "tokens": {
      "type": "object",
      "required": ["color", "radius", "spacing", "typography"],
      "properties": {
        "color": {
          "type": "object",
          "required": ["bg", "fg", "accent", "muted"],
          "properties": {
            "bg":     { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" },
            "fg":     { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" },
            "accent": { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" },
            "muted":  { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" },
            "success":{ "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" },
            "danger": { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" }
          },
          "additionalProperties": false
        },
        "radius": {
          "type": "object",
          "properties": {
            "sm": { "type": "string", "enum": ["0px","2px","4px","6px","8px"] },
            "md": { "type": "string", "enum": ["4px","8px","12px","16px"] },
            "lg": { "type": "string", "enum": ["8px","12px","16px","24px","9999px"] }
          },
          "additionalProperties": false
        },
        "spacing": {
          "type": "object",
          "properties": {
            "density": { "type": "string", "enum": ["compact","cozy","comfortable"] },
            "unit":    { "type": "number", "minimum": 1, "maximum": 16 }
          },
          "additionalProperties": false
        },
        "typography": {
          "type": "object",
          "properties": {
            "fontFamily":    { "type": "string" },
            "fontSizeBase":  { "type": "string", "pattern": "^[0-9]+(px|rem)$" },
            "fontWeightBody":{ "type": ["string","number"] },
            "fontWeightHead":{ "type": ["string","number"] }
          },
          "additionalProperties": false
        },
        "shadow": {
          "type": "object",
          "properties": {
            "sm": { "type": "string", "pattern": "^.*(px).*$" },
            "md": { "type": "string", "pattern": "^.*(px).*$" },
            "lg": { "type": "string", "pattern": "^.*(px).*$" }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    },
    "templateOptions": {
      "type": "object",
      "description": "Map component_type → { optionKey: { enum?, default, appliesClass } } — declarative options class wiring",
      "additionalProperties": {
        "type": "object",
        "additionalProperties": {
          "type": "object",
          "required": ["type", "default"],
          "properties": {
            "type":    { "enum": ["string", "boolean", "number"] },
            "enum":    { "type": "array", "items": { "type": "string" } },
            "default": { "type": ["string","boolean","number","null"] },
            "appliesClass": { "type": "string", "description": "className to append when truthy / equals enum value" }
          },
          "additionalProperties": false
        }
      }
    },
    "styles": {
      "type": "array",
      "description": "Pre-baked Theme Styles (delta tokens) — list keys + displayName for Theme Style picker UI (§2.8)",
      "items": {
        "type": "object",
        "required": ["styleKey", "displayName", "delta"],
        "properties": {
          "styleKey":    { "type": "string", "pattern": "^[a-z0-9_-]+$" },
          "displayName": { "type": "string" },
          "delta": {
            "type": "object",
            "description": "Same shape as tokens but every key is optional (override only)",
            "additionalProperties": true
          },
          "isDefault":   { "type": "boolean" }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

**กฎสำคัญของ Theme Schema:**
- `tokens.*` ทุก field เป็น `additionalProperties: false` — ทำให้ AST/ajv validator จับโทเคนหาย/ผิดชื่อได้ตั้งแต่ publish Theme
- `templateOptions[componentType][optionKey].appliesClass` ที่ Theme ประกาศ ต้อง map ไปยัง class ที่อยู่ใน `eut-runtime.css` เท่านั้น — Theme Roller แค่เลือก option แล้ว JS append class ห้าม pre-compute CSS ทุกกรณี (คงที่ + audit ง่าย)
- `delta` สามารถ override ได้เฉพาะ keys ที่ declare ใน `tokens` — Theme Style ที่ reference คีย์ที่ parent Theme ไม่มี ต้องถูก reject ที่ validator
- Tenant-scoped Custom Style (`is_tenant=true`) ต้องมี `tenant_id` ไม่ใช่ NULL — Validator ฝั่ง BE บังคับเสมอ

---

## 6. Security Contract

### 6.1 ห้าม Raw SQL / Raw Eval จาก JSONB Config

```python
# app/modules/ui_designer/resolvers/registry.py
from typing import Callable, Awaitable

QueryResolver = Callable[[dict], Awaitable[list[dict]]]

class ResolverRegistry:
    """AI Agent ห้ามเพิ่ม Resolver โดยไม่ผ่าน Whitelist นี้
    ห้าม dynamic eval ใดๆ ทั้งสิ้น"""
    _resolvers: dict[str, QueryResolver] = {}

    @classmethod
    def register(cls, key: str, fn: QueryResolver) -> None:
        if key in cls._resolvers:
            raise ValueError(f"Resolver '{key}' already registered")
        cls._resolvers[key] = fn

    @classmethod
    async def resolve(cls, key: str, params: dict) -> list[dict]:
        if key not in cls._resolvers:
            raise KeyError(f"Unregistered resolver: {key}")
        return await cls._resolvers[key](params)
```

### 6.2 Multi-tenancy
ทุกตารางหลักต้องมี `tenant_id` (ดู DDL §5.1) — Row-Level Security (RLS) ควรเปิดใน PostgreSQL ระดับ `tenant_id` ถ้าจะให้หลายโปรเจกต์ในเครือใช้ฐานข้อมูลร่วมกัน

### 6.3 Auth/RBAC
- ทุก Endpoint ต้องผ่าน JWT middleware ก่อนถึง Route Handler
- Role ขั้นต่ำ: `ui_designer.viewer`, `ui_designer.editor`, `ui_designer.admin`, `ui_designer.codegen` (แยกจาก editor เพราะเขียนไฟล์ลงดิสก์จริง)
- Save/Publish Layout ต้องเป็น `editor` ขึ้นไปเท่านั้น

### 6.4 Component Registry — ป้องกัน XSS
- Props ที่ Component รับต้อง Validate ผ่าน JSON Schema (`ui_component_catalog.prop_schema`)
- ห้าม `dangerouslySetInnerHTML` เว้นแต่ผ่าน `DOMPurify` แล้ว
- Custom Component ที่ Register เพิ่มต้องผ่าน Allowlist ของ Prop keys ที่กำหนดไว้ล่วงหน้า

### 6.5 Codegen Sandbox
- ห้าม Agent เขียนไฟล์นอก `project_root` และนอก `allowed_write_globs`
- ทุกการ Generate ต้องผ่าน Dry-run + Diff Preview ก่อน — ห้าม Write ตรงลง Production path โดยไม่มี Human Approve
- ห้าม Agent รัน `git push`, `rm -rf`, หรือคำสั่งทำลายข้อมูลได้เอง

### 6.6 Universal Theme — ป้องกัน CSS Injection / Token Escape
- `templateOptions` เป็น declarative enum/boolean เท่านั้น — `templateOptions[optionKey].appliesClass` ต้องถูก map จาก Theme Catalog ใน BE ไม่ใช่ raw string จากผู้ใช้; ห้าม Component เอาค่าจาก templateOptions ไป inline เป็น CSS หรือ `dangerouslySetInnerHTML`
- Theme Roller Save: ค่าที่ผู้ใช้ปรับต้องผ่าน JSON Schema (`themeSchema`, §5.3) validate ทุกครั้งก่อนเขียนลง `ui_theme_overrides`/`ui_theme_styles`
- Tenant isolation: tenant A read/write Theme Style ของตัวเองได้เท่านั้น; built-in Theme (`tenant_id IS NULL`) อ่านได้แต่แก้ไม่ได้; ทุก Theme mutation endpoint ต้องมี `Depends(require_role('ui_designer.editor'))` + tenant scope check
- ห้ามให้ Runtime นำค่า token ที่ไม่ได้ declare ใน `tokens` field มา inject เป็น CSS variable โดยตรง — pass ผ่าน `tokenResolver` whitelist เท่านั้น
- Custom Theme ที่ Target project register ผ่าน `registerTheme(bundle)` (Target B Library API) ต้องผ่าน `ajv` compile ตอน register แล้ว throw ถ้า invalid — ไม่มี hot-trust runtime theme ที่ข้าม validator

---

## 7. Roadmap

### Phase 0 — Security & Contract (2-3 วัน) 🔴 บังคับก่อนเริ่ม Phase 1
- นิยาม Resolver Registry Interface + JSON Schema layout v1 (§5.2)
- ตั้งค่า Auth Middleware (JWT + RBAC) รวม Role `ui_designer.codegen`
- Contract Test: ยิง Malformed Schema (layout + theme, §5.2 §5.3) เข้าไปแล้วต้องถูก Reject

### Phase 1 — Foundation & Schema Core (สัปดาห์ 1)
- `dbmate` migration ตาม §5.1 ทั้งหมด (รวม `ui_codegen_runs`, `ui_resolver_catalog`, `ui_theme_catalog`, `ui_theme_styles`, `ui_theme_overrides`)
- SQLModel + async session setup ตาม Project Structure §3.1
- JSON Schema layout v1 รวม `validation.*`, `depends_on`, `formBinding`, `styleRef` (page + component), `templateOptions` (§5.2)
- Theme JSON Schema v1 (`themeSchema.ts`/`theme_schema_v1.json`, §5.3) + ajv/jsonschema compiled ทั้ง 2 ฝั่ง
- Dual Vite build skeleton: `BUILD_MODE=designer` + `BUILD_MODE=lib` (+ `tsconfig.lib.json` ESLint guard, §3.4)
- Built-in EUT theme bundle (`src/themes/eut/`): `tokens.base.json`, `templateOptions.json`, presets `vita.json` / `vita-slate.json` / `vita-red.json`
- Seed `ui_theme_catalog` (theme_id='eut', is_default=true) + 3 rows `ui_theme_styles` presets
- Zustand `useUIStore` + `zundo` (undo/redo) — Designer; `useRenderStore` skeleton (Runtime formValues/touched/errors/submitState); `useThemeRollerStore` skeleton (draft token override, undo/redo)
- Unit Test คู่ขนานตั้งแต่เริ่ม

### Phase 2 — Core Engine Development (สัปดาห์ 2)
- Render Engine (Interpreter Pattern) — อ่าน `layout_json` ผ่าน Component Registry เท่านั้น
- `RuntimeFormProvider` + `formValidator` pure fn (§2.6): onChange debounced validate + Submit Lifecycle (idle→validating→ready→submitting)
- Designer Canvas + Property Inspector (`@dnd-kit/core`) พร้อม panel แก้ `validation` / `depends_on` / `formBinding` และ `TemplateOptionsPanel` (declarative enum/bool, §2.8)
- Resolver Registry เชื่อมกับ Render Engine ผ่าน props `resolveBaseUrl` (Library-safe)

### Phase 2.5 — Universal Theme & Theme Roller (3-4 วัน) 🎨 — ทำงานคู่กับ Phase 2 ได้
- `RuntimeThemeProvider` + `tokenResolver` (cascade page → component `styleRef`, §2.8) — inject CSS variables ลง `[data-eut-theme="..."]` scoped DOM
- `useThemeStyle` + `useResolvedTokens` (TanStack Query cache ลด redundant fetch; key ด้วย `styleRef`)
- `templateOptionClasses` mapping + `UTRenderer` Consumer ใช้ class ไม่ใช่ inline style
- `ThemeRoller.tsx` (Designer) + `useThemeRollerStore`: live preview ทุก token slider สะท้อนกลับผ่าน override state
- POST `/api/themes/{theme_id}/styles` (Save as Theme Style) + GET `/api/themes/styles/{styleRef}` สำหรับ render
- EUT default CSS output `eut-runtime.css` build script (`scripts/build-theme-css.ts`) จาก token bundle
- Validate Theme bundle deltas (`jsonschema` BE / `ajv` FE) ก่อน publish ทุกครั้ง (reject stale keys)
- Unit Test: Theme Roller preview snapshot, delta validation reject, token cascade precedence

### Phase 3 — Reactive UI & API Binding (สัปดาห์ 3)
- Cascading LOV ผ่าน `useCascadeQuery` + TanStack Query (queryKey ฝัง deps, auto-refetch) + Redis Cache
- `useDependsOn` reactive broadcast on `useRenderStore.formValues` + child reset on parent change (§2.7)
- `depends_on` DAG validator ทั้งฝั่ง ajv (FE) และ jsonschema (BE) — ปฏิเสธ cycle
- `build:lib` output ทดสอบ import ใน sandbox Next.js/Vite ของ Target Project (ผ่าน `npm pack` + `file:` install)
- Preview Mode (Edit ↔ View)

### Phase 4 — Target Project Codegen (สัปดาห์ 4)
- `ProjectScanner` — Framework/Convention detection แบบ AST-based จริง
- Diff Preview + Human Approval flow
- Git-aware File Writer (Sandbox ตาม `allowed_write_globs`)
- ทดสอบ End-to-end กับ Non-production copy ของ `/u01/eraowl-ops` ก่อน

### Phase 5 — AI Orchestration Layer
- เชื่อม LangGraph Agent ให้ Generate `layout_json` จาก Natural Language (validate ด้วย JSON Schema ก่อนบันทึกเสมอ)
- Agent เสนอ Codegen Diff ให้ Human Approve เท่านั้น — ไม่มีสิทธิ์ Commit เข้า Target Project เอง

---

## 8. Target Project Integration (Codegen เข้า Project จริง)

### 8.1 แนวคิด
ผู้ใช้ระบุ Project Folder ที่ต้องการให้ UI Engine อ้างอิงและ Generate โค้ดเข้าไป เช่น:

```
TARGET_PROJECT_ROOT=/u01/eraowl-ops
```

### 8.2 ขั้นตอนการทำงาน (ดูรายละเอียด Flow เต็มใน §2.4)
1. Register Project Root
2. Scan Project Convention (framework, style)
3. Design ใน UI Engine (drag & drop)
4. Codegen (dry-run) ตาม Convention
5. Diff Preview
6. Human Approve + Commit

### 8.3 Config Schema
```python
# app/modules/ui_designer/codegen/config.py
from pydantic import BaseModel, field_validator
from pathlib import Path

class CodegenTargetConfig(BaseModel):
    project_root: str
    target_subpath: str
    allowed_write_globs: list[str] = [
        "apps/web/src/pages/generated/**",
        "apps/web/src/components/generated/**",
    ]
    dry_run: bool = True   # default ต้อง True เสมอ ห้าม Agent เปลี่ยนเป็น False เอง

    @field_validator("project_root")
    @classmethod
    def must_be_absolute_and_exist(cls, v: str) -> str:
        p = Path(v)
        if not p.is_absolute():
            raise ValueError("project_root ต้องเป็น absolute path เท่านั้น")
        return v
```

### 8.4 Project Scanner (ตัวอย่างฐานสำหรับ Agent)
```python
# app/modules/ui_designer/codegen/scanner.py
import json
from pathlib import Path

class ProjectScanner:
    """สแกน Target Project เพื่อดึง Convention มาก่อน Gen โค้ด
    ห้ามอ่านไฟล์นอก project_root เด็ดขาด"""

    def __init__(self, project_root: str):
        self.root = Path(project_root).resolve()

    def detect_framework(self) -> str:
        pkg_json = self.root / "package.json"
        if pkg_json.exists():
            data = json.loads(pkg_json.read_text())
            deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            if "next" in deps:
                return "nextjs"
            if "vite" in deps:
                return "vite-react"
        if (self.root / "pyproject.toml").exists():
            return "fastapi"
        return "unknown"

    def detect_component_convention(self, sample_dir: str) -> dict:
        target = self.root / sample_dir
        if not target.exists():
            return {"convention": "none_found", "use_default": True}
        # TODO(agent): ใช้ ts-morph หรือ Babel AST parse .tsx ตัวอย่าง 3-5 ไฟล์
        return {"convention": "detected", "use_default": False}
```

### 8.5 ตัวอย่างการใช้งานจริง
```bash
POST /api/ui-designer/codegen-targets
{
  "page_id": "uuid-xxxx",
  "project_root": "/u01/eraowl-ops",
  "target_subpath": "apps/web/src/pages/generated"
}

GET /api/ui-designer/codegen-targets/{id}/scan
→ { "framework_detected": "nextjs", "component_style": "PascalCase + named export" }

POST /api/ui-designer/codegen-targets/{id}/generate?dry_run=true
→ คืน diff ให้ preview

POST /api/ui-designer/codegen-targets/{id}/generate?dry_run=false&approved_by=<user>
```

---

## 9. AI Agentic Coding — Prompt Contracts

### 9.1 กฎตายตัวสำหรับ Agent ทุกตัวที่แตะโปรเจกต์นี้
1. ห้าม Generate Code ที่รัน Raw SQL/Raw eval จาก JSONB field ใดๆ — ต้องผ่าน `ResolverRegistry` เท่านั้น
2. ทุก Endpoint ใหม่ต้องมี Dependency บน Auth middleware
3. ทุกตารางใหม่ต้องมี `tenant_id`
4. Migration ต้องเขียนเป็นไฟล์ `dbmate` ห้าม inline DDL ใน Python
5. Component ใหม่ต้อง Register ผ่าน Component Registry พร้อม Prop Schema
6. การเขียนไฟล์เข้า Target Project ต้องอยู่ใน `allowed_write_globs` เท่านั้น และผ่าน Dry-run + Diff Preview ก่อนเสมอ
7. ทุก Module ที่สร้างต้องมี Unit Test อย่างน้อย Happy Path + 1 Malformed-input case
8. ต้องวางไฟล์ตาม Project Structure ใน §3 — ห้ามสร้างโครงสร้างโฟลเดอร์ใหม่เองโดยไม่ปรึกษา
9. Logic Form Validation ต้องมาจาก `layout_json.validation.*` (§5.2) เท่านั้น — ห้าม Component ฝังเงื่อนไข Required/Pattern เอง; `customResolver` ต้องผ่าน `ResolverRegistry`
10. `depends_on` ต้องเป็น DAG (ห้าม cycle) — ต้อง validate ทั้ง ajv (FE) และ jsonschema (BE) ก่อน publish layout
11. `src/render-engine/**` และ `src/store/useRenderStore.ts` ห้าม import อะไรจาก `src/designer/**`, `src/api/**`, Monaco หรือ `@dnd-kit` — ผูกด้วย `tsconfig.lib.json` + ESLint `no-restricted-imports` เพื่อให้ Library Build ไม่ leak
12. Trigger submit workflow: ห้าม Render Engine ยิง HTTP ธุรกิจเอง — ต้องส่ง payload ออกทาง `onValidSubmit(payload)` ของ `<UIRenderer>` และปล่อยให้ Target Project ที่ import Library จัดการต่อ
13. Library build (Target B) ต้องประกาศ `react`, `react-dom`, `zustand`, `@tanstack/react-query` เป็น `peerDependencies` + `external` เสมอ — ห้าม bundle React ซ้ำ
14. ทุกค่าที่เปลี่ยน Visual ต้องไปผ่าน Design Token ของ Universal Theme (§2.8) ห้าม Component ใช้ literal color/radius/spacing ใน tsx; Theme tokens ต้อง validate ด้วย `themeSchema` (§5.3)
15. `templateOptions` เป็น declarative enum/boolean เท่านั้น — `appliesClass` ต้องมาจาก Theme Catalog ไม่ใช่ผู้ใช้; ห้ามเอาค่า templateOptions ไป inline CSS / `dangerouslySetInnerHTML` (ผูกกับ §6.6)
16. Theme Style mutation endpoint (Save as Style, Override) ต้องมี `Depends(require_role('ui_designer.editor'))` + tenant scope check; tenant อื่นเข้าถึง built-in theme (`tenant_id IS NULL`) ได้แค่ read

### 9.2 Structured Prompt Template — Backend Module
```
ROLE: Expert FastAPI + SQLModel engineer for "eraowl-ui-engine"
CONTEXT: อ่าน §3.1 (Project Structure), §5 (Schema), §6 (Security Contract), §8 (Target Project Integration)
CONSTRAINTS:
  - ต้องใช้ ResolverRegistry แทน raw SQL ทุกกรณี
  - ทุก endpoint ต้องมี Depends(require_role(...))
  - tenant_id มาจาก JWT claim ไม่ใช่ request body
  - ถ้าเกี่ยวกับ Codegen: ต้องเขียนผ่าน allowed_write_globs + dry_run flow เท่านั้น
TASK: {ระบุ module}
OUTPUT: models.py, service.py, router.py, test_*.py (ตามตำแหน่งใน §3.1)
```

### 9.3 Structured Prompt Template — Codegen เข้า Target Project
```
ROLE: Expert Codegen Agent for "eraowl-ui-engine" → Target Project Integration
CONTEXT: อ่าน §8 ทั้งหมดก่อนเริ่ม
TARGET: project_root=/u01/eraowl-ops, target_subpath=apps/web/src/pages/generated
CONSTRAINTS:
  - ห้ามเขียนไฟล์นอก allowed_write_globs
  - ต้อง scan convention เดิมก่อน gen เสมอ (ProjectScanner)
  - ผลลัพธ์ต้องเป็น diff preview ก่อน ห้าม write ตรง
  - ห้ามรัน git push / git commit เอง — รอ Human Approve
TASK: {ระบุหน้าจอที่ต้องการ gen}
OUTPUT: diff patch (unified format) พร้อมสรุปไฟล์ที่จะถูกสร้าง/แก้ไข
```

### 9.4 Structured Prompt Template — Render Engine / Library Module (Frontend)
```
ROLE: Expert React 19 + Vite library engineer for "eraowl-ui-engine" Render Engine
CONTEXT: อ่าน §2.6 (Form State Lifecycle), §2.7 (Cascading LOV), §2.8 (Universal Theme), §3.2 + §3.4 (Dual Build), §5.2 (Schema รวม validation/depends_on/styleRef/templateOptions)
TARGET BUILD: BUILD_MODE=lib (Library Mode — output ESM+UMD ใต้ dist/eraowl-ui-engine)
CONSTRAINTS:
  - ไฟล์ที่แตะต้องอยู่ใน src/render-engine/** หรือ src/store/useRenderStore.ts เท่านั้น — ห้าม import จาก src/designer/**, src/api/**, Monaco, @dnd-kit
  - Validation logic ต้องอ่านจาก layout_json.validation.* (§5.2); customResolver เรียกผ่าน props.resolveBaseUrl → /api/resolve/{key} เท่านั้น
  - Cascading LOV: depends_on → useDependsOn + useCascadeQuery; queryKey ฝัง dep values, ห้าม invalidateQueries ด้วยมือ
  - Theme render: ใช้ useResolvedTokens + templateOptionClasses เท่านั้น; cascade สำคัญ component.styleRef > page.styleRef > tenant default (§2.8)
  - ประกาศ react/react-dom/zustand/@tanstack/react-query เป็น peerDependencies + rollupOptions.external; ห้าม bundle React ซ้ำ
  - public export เฉพาะผ่าน src/render-engine/index.ts; ไม่ส่ง HTTP ธุรกิจ — submit ออกทาง props.onValidSubmit(payload)
TASK: {ระบุ hook / Component / Provider module}
OUTPUT: .tsx/.ts + Vitest (Happy path + 1 Malformed-input case) พร้อมตรวจ `tsc -p tsconfig.lib.json` ผ่าน
```

### 9.5 Structured Prompt Template — Universal Theme Module (FE Designer + Render Engine scope)
```
ROLE: Expert Theme System engineer for "eraowl-ui-engine" Universal Theme (UT-inspired)
CONTEXT: อ่าน §2.8 (Theme System & Theme Roller), §3.2 (themes directory), §3.4 (Library exports), §5.2 (styleRef / templateOptions in layout_json), §5.3 (Theme JSON Schema), §6.6 (Theme Security)
SCOPE: src/themes/** (built-in EUT bundle), src/designer/theme/** (ThemeRoller), src/render-engine/theme/** (RuntimeThemeProvider + tokenResolver)
CONSTRAINTS:
  - ทุก token ที่ Theme ประกาศ ต้อง validate ด้วย themeSchema (§5.3) ทั้ง ajv (FE) และ jsonschema (BE); delta อ้าง key นอก base tokens ต้อง reject
  - templateOptions ต้องเป็น declarative enum/boolean; `appliesClass` มาจาก Theme (BE) เท่านั้น ห้ามรับ raw จาก user → inline CSS
  - Theme Roller: live preview ผ่าน CSS variable injection (scoped `[data-eut-theme]`) ไม่ใช่ inline styles; Save-as-Style แล้ว tenant-scoped row เท่านั้น
  - Cascade precedence: component.styleRef > page.styleRef > tenant default style — `tokenResolver` ต้อง honour ลำดับนี้เสมอ
  - ลด runtime fetch: TanStack cache ด้วย queryKey ['theme', styleRef]; ไม่ invalidate มือ; `eut-runtime.css` ship เป็น static asset ใน dist ของ Library
  - Tenant isolation: built-in theme (tenant_id IS NULL) read-only; mutation endpoint ต้อง `Depends(require_role('ui_designer.editor'))` + tenant scope
TASK: {ระบุ Theme Roller feature / tokenResolver fn / RuntimeThemeProvider / ThemeStylePicker}
OUTPUT: .tsx/.ts + Vitest (snapshot + 1 malformed-schema-should-reject case) + Pytest ถ้าเกี่ยวกับ BE theme endpoint
```

### 9.6 การใช้กับ LangGraph Agent
- Agent เขียนได้แค่ `layout_json` draft → ผ่าน JSON Schema validation node → เสนอ Human-in-the-loop ก่อน Publish
- Agent ไม่มี Tool ที่เขียนไฟล์ Migration หรือ Resolver ได้โดยตรง
- Agent ที่ทำ Codegen เข้า Target Project ต้องเป็นคนละ Tool/Role กับ Agent ที่ออกแบบ Layout

---

## 10. Testing Strategy

| Layer | Test Type | เครื่องมือ |
|---|---|---|
| Render Engine (Interpreter) | Unit — แปลง JSON → React tree ถูกต้อง | Vitest + React Testing Library |
| Resolver Registry | Unit — reject unregistered key | Pytest |
| API | Integration — Auth, RBAC, tenant isolation | Pytest + httpx |
| Schema Validation | Contract — malformed JSON ต้องถูก reject | ajv (FE) / jsonschema (BE) |
| Project Scanner | Unit — detect framework ถูกต้องจาก fixture project | Pytest |
| Codegen Sandbox | Integration — เขียนไฟล์นอก allowed_write_globs ต้องถูก block | Pytest |
| Cascading LOV | E2E | Playwright |
| Form State Lifecycle & Validation (§2.6) | Unit — formValidator pure fn + Submit state machine (`idle→validating→ready→submitting`) | Vitest |
| Cascading LOV Dynamic Context (§2.7) | Unit + Integration — depends_on broadcast → queryKey refetch → child reset | Vitest + React Testing Library |
| `depends_on` DAG validator | Contract — cycle & duplicate dependency ต้องถูก reject ตั้งแต่ Schema phase | ajv (FE) / jsonschema (BE) |
| Library Build (Target B §3.4) | Build — `BUILD_MODE=lib` export `UIRenderer`/`RuntimeFormProvider`/`RuntimeThemeProvider` และไม่ leak `src/designer/**`; `tsc -p tsconfig.lib.json` ผ่าน; `npm pack` + import ใน sandbox Target ได้ | Vitest + esbuild metafile assert |
| Universal Theme — Theme Roller (§2.8) | Unit + E2E — live preview snapshot; Save-as-Style เขียน tenant-scoped row; reset สู่ parent style | Vitest + Playwright |
| Universal Theme — token cascade (§2.8) | Unit — precedence `component.styleRef > page.styleRef > tenant default`; missing styleRef fallback default; override key นอก base tokens ต้อง reject | Vitest (tokenResolver) |
| Universal Theme — Schema validation (§5.3) | Contract — delta อ้าง key ที่ไม่มีใน tokens ต้องถูก reject; regex color pattern ต้องทำงาน | ajv (FE) / jsonschema (BE) |
| Universal Theme — Template Options | Unit — enum/bool options append class ผ่าน `templateOptionClasses`; ห้าม inline CSS | Vitest + React Testing Library |
| Universal Theme — Tenant isolation | Integration — built-in theme read-only; tenant A ไม่มีสิทธิ์ mutated theme of tenant B | Pytest + httpx |

---

## 11. Open Decisions

1. **DB Driver:** asyncpg vs psycopg3 — เลือกตาม Target Project หลักที่จะเชื่อม
2. **Auth Provider:** ใช้ Keycloak ร่วมกับระบบอื่นในเครือ หรือแยก JWT issuer เฉพาะ UI Engine
3. **DB แยกก้อนหรือ Schema เดียวกับ Target Project:** ถ้าแยกก้อน ต้องวางแผน Cross-DB reference สำหรับ `tenant_id`
4. **Target Project แรกที่จะทดสอบ Codegen:** แนะนำเริ่มจาก Non-production copy ก่อน เพื่อลดความเสี่ยงตอน Phase 4
5. **Library Mode distribution channel (§3.4):** เผยแพร่ Target B ผ่าน private npm registry ของ EraOwl, atau tarball `file:` install จาก artifact ใน CI — ต้องเลือกให้สอดคล้องกับ Versioning และข้อจำกัดด้าน security ของ Target Project (เช่น AXON WMS ที่อาจจำกัด registry ภายนอก)
6. **Cascading LOV cache reset strategy (§2.7):** ใช้ TanStack auto-refetch-on-key-change อย่างเดียว หรือเพิ่ม `queryClient.removeQueries({ predicate })` เมื่อ parent value ถูก reset เพื่อคุม memory footprint ในฟอร์มขนาดใหญ่ (depth ≥ 3)
7. **`customResolver` scope ของ Validation:** อนุญาตให้ `validation.customResolver` เรียกแบบ synchronous (ฝั่ง FE เท่านั้น กรณี regex/format ที่ไม่ต้องการ network) หรือบังคับให้ทุก custom validation ผ่าน backend ResolverRegistry เสมอ เพื่อ audit trail
8. **Universal Theme CSS strategy (§2.8):** Build `eut-runtime.css` เป็น static sheet (CSS variables + class rules) แบบ scoped `[data-eut-theme]` ที่ Target project import เอง หรือ generate inline `<style>` ใน `RuntimeThemeProvider` runtime เพื่อลด dependency ของ host — ต้องชั่งน้ำหนักเรื่อง bundle size, SSR/CSR ของ Target และความเสี่ยง Vendor CSS กัดกับ host
9. **Custom Theme ownership & distribution (§2.8):** tenant เก็บ Custom Theme Styles ใน DB (`ui_theme_styles` tenant-scoped) หรือเก็บเป็น Theme bundle file ใน Library Build ของแต่ละ tenant (drop `src/themes/eut/styles/*.json` ลง build) — เลือกตาม compliance + multi-region setup
10. **Theme Style Codegen ช่วง Gen โค้ดเข้า Target (§8, §2.8):** ตอน Codegen โค้ดเข้า Target Project ที่มี Theme อิสระ (เช่น Target B library ติดตั้งคนละ default theme) ควร emit `styleRef` เป็น literal string ใน generated TSX หรือ emit variable เพื่อให้ runtime สามารถ override ที่หน้า host ได้อีกที

---

### 12. Refinement Changelog

เอกสารนี้ผ่านการ Refinement เพื่อให้กลายเป็นพิมพ์เขียวที่ไร้รอยต่อยิ่งขึ้น ตามจุดสำคัญที่ได้เพิ่มเข้ามา:

| จุด Refinement | แก้ในส่วน | สรุปการเปลี่ยนแปลง |
|---|---|---|
| ⚠️ 1. Form State Lifecycle & Validation | §2.6, §3.2 (`render-engine/hooks/`, `validation/`, `store/useRenderStore.ts`), §5.2 (`validation.*`, `formBinding`), Roadmap Phase 1–2, §9.1 rule 9, §9.4 prompt, §10 test rows | เพิ่ม `useRenderStore` (formValues/touched/errors/submitState) + `RuntimeFormProvider` + `formValidator` pure fn + Submit Lifecycle `idle→validating→ready→submitting` + `onValidSubmit(payload)` callback |
| 🔄 2. Cascading LOV Dynamic Context | §2.7, §5.2 (`depends_on`), Phase 3, §9.1 rule 10, §10 test rows | Global broadcast บน `useRenderStore.formValues` + `useDependsOn` reactive selector + `useCascadeQuery` ฝัง deps ใน `queryKey` (auto-refetch, ไม่ invalidate มือ) + child reset on parent change + `depends_on` DAG validator (no cycle) |
| 🏗️ 3. Build & Interoperability Target | §3.2 (`vite.lib.config.ts`, `package.json` exports), §3.4 (Dual Build Target table + Vite/`package.json` code), Phase 1 + 3, §9.1 rule 11–13, §9.4 prompt, §10 test row, §11 Open Decision 5 | แยก Build เป็น Target A (Designer SPA) และ Target B (ESM+UMD Library ครอบ `src/render-engine/**`); peer-dep React/Zustand/TanStack; `tsconfig.lib.json` guard กัน leak; export `UIRenderer`, `RuntimeFormProvider` ให้ `import { UIRenderer } from 'eraowl-ui-engine'` |
| 🎨 4. Universal Theme (UT-inspired) — Theme Catalog + Theme Style + Theme Roller + Template Options | §2.8, §3.2 (`designer/theme/`, `render-engine/theme/`, `themes/eut/`, `styles/eut-runtime.css`), §3.4 (Library exports + theme assets in `package.json`), §5.1 (DDL `ui_theme_catalog`/`ui_theme_styles`/`ui_theme_overrides` + `ui_component_catalog.template_options`), §5.2 (`styleRef` page & component + `templateOptions` Schema), §5.3 (Theme JSON Schema v1 ครบ), Roadmap Phase 1 (EUT seed) + Phase 2.5, §6.6 (Theme Security), §9.1 rule 14–16, §9.5 prompt, §10 test rows (5 rows), §11 Open Decisions 8–10 | Theme = token bundle + per-component templateOptions; Style = preset delta tokens (เช่น `eut.vita-slate`); Theme Roller = live CSS variable preview + Save-as-Style (tenant-scoped); `RuntimeThemeProvider` cascade `component.styleRef > page.styleRef > tenant default`; declarative `templateOptions` only (no raw CSS); validate ด้วย `themeSchema` ทั้ง ajv/jsonschema; tenant isolation สำหรับ mutation endpoints; EUT built-in 3 Style presets (`vita`, `vita-slate`, `vita-red`) seed เป็น default |

---

*เอกสารนี้คือ Reference เดียวสำหรับสั่งงาน AI Agent ต่อจากนี้*
