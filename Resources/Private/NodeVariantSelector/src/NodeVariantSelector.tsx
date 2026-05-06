import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { Icon, SelectBox } from '@neos-project/react-ui-components';
// @ts-ignore
import { actions, selectors } from '@neos-project/neos-ui-redux-store';
// @ts-ignore
import { neos } from '@neos-project/neos-ui-decorators';
// @ts-ignore
import { Node } from '@neos-project/neos-ts-interfaces';

import { NodeVariantPreviewElement } from './NodeVariantPreviewElement';

import styles from './NodeVariantSelector.module.css';

interface NodeVariantSelectorProps {
    /** The currently focused node from the Neos UI Redux store */
    focusedNode: Node | null;
    /** Content dimension configuration keyed by dimension name */
    contentDimensions: Record<string, DimensionConfig>;
    /** Currently active dimension values, shape: { language: ['de'] } */
    activeDimensions: Record<string, string | string[]> | null;
    i18nRegistry: I18nRegistry;
    dataSourcesDataLoader: DataSourcesDataLoader;
    selectPreset: (coordinates: Record<string, string>) => void;
}

// Constants

const DATA_SOURCE_IDENTIFIER = 'flowpack-nodevariantselector-variants';

const STATUS_ORDER: Record<VariantStatus, number> = { occupied: 0, shineThrough: 1, missing: 2 };

const STATUS_CLASS: Record<VariantStatus, string> = {
    occupied: '',
    shineThrough: styles.nvsVariantShineThrough,
    missing: styles.nvsVariantMissing,
};

// Static helpers

function buildActiveCoordinates(
    activeDimensions: Record<string, string | string[]> | null,
    contentDimensions: Record<string, DimensionConfig>
): Record<string, string> | null {
    if (!activeDimensions) return null;
    return Object.keys(contentDimensions).reduce<Record<string, string>>((acc, dimName) => {
        const values = activeDimensions[dimName];
        acc[dimName] = Array.isArray(values) ? values[0] : values;
        return acc;
    }, {});
}

function isCurrentVariant(
    coordinates: Record<string, string>,
    activeCoordinates: Record<string, string> | null
): boolean {
    return !!activeCoordinates && Object.keys(activeCoordinates).every(d => activeCoordinates[d] === coordinates[d]);
}

/** Plain-text label used for the option title / tooltip. */
function dimensionLabelText(
    coordinates: Record<string, string>,
    contentDimensions: Record<string, DimensionConfig>
): string {
    return Object.keys(contentDimensions)
        .map(dimName => {
            const preset = contentDimensions[dimName]?.presets?.[coordinates[dimName]];
            return preset?.label ?? coordinates[dimName] ?? dimName;
        })
        .join(' / ');
}

/** Full JSX label: an Icon for each dimension followed by the preset name. */
function dimensionLabel(
    coordinates: Record<string, string>,
    contentDimensions: Record<string, DimensionConfig>
): React.ReactNode {
    return (
        <span>
            {Object.keys(contentDimensions).map(dimName => {
                const dimConfig = contentDimensions[dimName];
                const preset = dimConfig?.presets?.[coordinates[dimName]];
                const presetLabel = preset?.label ?? coordinates[dimName] ?? dimName;
                return (
                    <span key={dimName} style={{ marginRight: '0.75em' }}>
                        {dimConfig?.icon && <Icon icon={dimConfig.icon} padded="right" />}
                        {presetLabel}
                    </span>
                );
            })}
        </span>
    );
}

function sortVariants(
    variants: Variant[],
    activeCoordinates: Record<string, string> | null
): Variant[] {
    return [...variants].sort((a, b) => {
        const ac = isCurrentVariant(a.coordinates, activeCoordinates);
        const bc = isCurrentVariant(b.coordinates, activeCoordinates);
        if (ac && !bc) return -1;
        if (!ac && bc) return 1;
        return (STATUS_ORDER[a.status] ?? 2) - (STATUS_ORDER[b.status] ?? 2);
    });
}

function buildOptions(
    variants: Variant[],
    activeCoordinates: Record<string, string> | null,
    contentDimensions: Record<string, DimensionConfig>,
    i18nRegistry: I18nRegistry
): NodeVariantOption[] {
    return sortVariants(variants, activeCoordinates).map(variant => ({
        value: variant.coordinates,
        label: dimensionLabel(variant.coordinates, contentDimensions),
        secondaryLabel: i18nRegistry.translate(`Flowpack.NodeVariantSelector:Main:status.${variant.status}`),
        title: `${dimensionLabelText(variant.coordinates, contentDimensions)} – ${i18nRegistry.translate(`Flowpack.NodeVariantSelector:Main:tooltip.${variant.status}`)}`,
        className: STATUS_CLASS[variant.status],
    }));
}

// Component

const NodeVariantSelector: React.FC<NodeVariantSelectorProps> = ({
    focusedNode,
    contentDimensions,
    activeDimensions,
    i18nRegistry,
    dataSourcesDataLoader,
    selectPreset,
}): React.ReactElement | null => {
    const [variants, setVariants] = useState<Variant[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadVariants = useCallback(() => {
        if (!focusedNode?.contextPath) {
            setVariants(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        dataSourcesDataLoader.resolveValue(
            {
                contextNodePath: focusedNode.contextPath,
                dataSourceIdentifier: DATA_SOURCE_IDENTIFIER,
                dataSourceDisableCaching: true
            },
            null
        ).then(data => {
            setVariants(Array.isArray(data) ? (data as Variant[]) : null);
            setIsLoading(false);
        }).catch(() => {
            setVariants(null);
            setIsLoading(false);
        });
    }, [focusedNode?.contextPath, dataSourcesDataLoader]);

    useEffect(() => {
        loadVariants();
    }, [loadVariants]);

    if (isLoading || !variants || variants.length === 0) {
        return null;
    }

    const activeCoordinates = buildActiveCoordinates(activeDimensions, contentDimensions);
    const options = buildOptions(variants, activeCoordinates, contentDimensions, i18nRegistry);
    const currentVariant = variants.find(v => isCurrentVariant(v.coordinates, activeCoordinates));
    const currentValue = currentVariant?.coordinates ?? options[0]?.value ?? null;

    return (
        <SelectBox
            id="__neos__nodeVariantsSelector"
            options={options}
            value={currentValue}
            onValueChange={(coordinates: Record<string, string>) => selectPreset(coordinates)}
            ListPreviewElement={NodeVariantPreviewElement}
        />
    );
};


// ─── Redux + Neos wiring ─────────────────────────────────────────────────────

const ConnectedNodeVariantSelector = connect(
    (state: any) => ({
        focusedNode: selectors.CR.Nodes.focusedSelector(state),
        contentDimensions: state.cr.contentDimensions.byName,
        activeDimensions: state.cr.contentDimensions.active
    }),
    { selectPreset: actions.CR.ContentDimensions.selectPreset }
)(NodeVariantSelector);

export default (neos as any)((globalRegistry: any) => ({
    i18nRegistry: globalRegistry.get('i18n'),
    dataSourcesDataLoader: globalRegistry.get('dataLoaders').get('DataSources')
}))(ConnectedNodeVariantSelector);
