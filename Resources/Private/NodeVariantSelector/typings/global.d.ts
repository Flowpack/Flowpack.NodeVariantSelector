declare module '*.module.css';

type VariantStatus = 'occupied' | 'shineThrough' | 'missing';

interface Variant {
    coordinates: Record<string, string>;
    status: VariantStatus;
}

interface DimensionPreset {
    label?: string;

    [key: string]: unknown;
}

interface DimensionConfig {
    label?: string;
    icon?: string;
    presets?: Record<string, DimensionPreset>;

    [key: string]: unknown;
}

interface I18nRegistry {
    translate(key: string): string;
}

interface DataSourcesDataLoader {
    resolveValue(options: {
        contextNodePath: string;
        dataSourceIdentifier: string;
        dataSourceDisableCaching: boolean;
    }, value: null): Promise<unknown>;
}

interface NodeVariantOption {
    label: React.ReactNode | string;
    value: Record<string, string>;
    imageUri?: string;
    icon?: string;
    secondaryLabel?: string;
    tertiaryLabel?: string;
    className?: string;
}
