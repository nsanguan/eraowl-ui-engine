import { useState } from "react";

interface TreeNode {
  key: string;
  label: string;
  icon?: string;
  expanded?: boolean;
  children?: TreeNode[];
}

interface TreeProps {
  id?: string;
  type?: "tree" | "Tree";
  nodes?: TreeNode[];
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

function TreeNodeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(node.expanded ?? false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="eut-tree__node" style={{ paddingLeft: `${depth * 20}px` }}>
      <div className="eut-tree__node-row">
        {hasChildren ? (
          <button
            className="eut-tree__node-toggle"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? "▼" : "▶"}
          </button>
        ) : (
          <span className="eut-tree__node-spacer" />
        )}
        {node.icon && <span className="eut-tree__node-icon">{node.icon}</span>}
        <span className="eut-tree__node-label">{node.label}</span>
      </div>
      {hasChildren && expanded && (
        <div className="eut-tree__node-children">
          {node.children!.map((child) => (
            <TreeNodeItem key={child.key} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Tree({ id, nodes = [], templateOptions }: TreeProps) {
  return (
    <div
      id={id}
      data-eut-component="tree"
      className="eut-tree"
      role="tree"
    >
      {nodes.map((node) => (
        <TreeNodeItem key={node.key} node={node} />
      ))}
    </div>
  );
}
