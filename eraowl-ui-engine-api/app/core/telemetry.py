"""OpenTelemetry setup placeholder.

Enable distributed tracing and metrics export via OTLP when configured.
"""

from app.core.config import settings


def init_telemetry() -> None:
    """Initialise OTel tracer-provider and meter-provider.

    TODO: wire up ``opentelemetry-sdk`` + ``opentelemetry-exporter-otlp``.
    """
    if settings.OTEL_EXPORTER_OTLP_ENDPOINT is None:
        return

    # from opentelemetry import trace
    # from opentelemetry.sdk.trace import TracerProvider
    # from opentelemetry.sdk.trace.export import BatchSpanProcessor
    # from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    #
    # provider = TracerProvider()
    # processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT))
    # provider.add_span_processor(processor)
    # trace.set_tracer_provider(provider)
    pass
