import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

// eslint-disable-next-line camelcase
import {SelectBox, SelectBox_Option_MultiLineWithThumbnail} from '@neos-project/react-ui-components';

import {actions, selectors} from '@neos-project/neos-ui-redux-store';
import {neos} from '@neos-project/neos-ui-decorators';

const DATA_SOURCE_IDENTIFIER = 'flowpack-nodevariantselector-variants';

const STATUS_CONFIG = {
    occupied:     {icon: 'check-circle',       color: '#00A4EB'},
    shineThrough: {icon: 'exclamation-circle',  color: '#FF8700'},
    missing:      {icon: 'times-circle',        color: '#CC0000'},
};

/** Returns a data URI for a small filled circle SVG in the given hex colour. */
function statusImageUri(color) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${color}"/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

class NodeVariantSelector extends PureComponent {
    static propTypes = {
        focusedNode: PropTypes.object,
        contentDimensions: PropTypes.object.isRequired,
        activeDimensions: PropTypes.object,
        i18nRegistry: PropTypes.object.isRequired,
        dataSourcesDataLoader: PropTypes.shape({
            resolveValue: PropTypes.func.isRequired
        }).isRequired,
        selectPreset: PropTypes.func.isRequired
    };

    state = {variants: null, isLoading: false};

    componentDidMount() { this.loadVariants(); }

    componentDidUpdate(prevProps) {
        if (prevProps.focusedNode?.contextPath !== this.props.focusedNode?.contextPath) {
            this.loadVariants();
        }
    }

    loadVariants() {
        const {focusedNode, dataSourcesDataLoader} = this.props;
        if (!focusedNode?.contextPath) {
            this.setState({variants: null, isLoading: false});
            return;
        }
        this.setState({isLoading: true});
        dataSourcesDataLoader.resolveValue(
            {contextNodePath: focusedNode.contextPath, dataSourceIdentifier: DATA_SOURCE_IDENTIFIER, dataSourceDisableCaching: true},
            null
        ).then(variants => {
            this.setState({variants: Array.isArray(variants) ? variants : null, isLoading: false});
        }).catch(() => {
            this.setState({variants: null, isLoading: false});
        });
    }

    render() {
        const {activeDimensions, contentDimensions, i18nRegistry} = this.props;
        const {variants, isLoading} = this.state;

        if (isLoading || !variants || variants.length === 0) {
            return null;
        }

        const activeCoordinates = activeDimensions
            ? Object.keys(contentDimensions).reduce((acc, dimName) => {
                const values = activeDimensions[dimName];
                acc[dimName] = Array.isArray(values) ? values[0] : values;
                return acc;
            }, {})
            : null;

        const isCurrentVariant = (coordinates) => activeCoordinates
            && Object.keys(activeCoordinates).every(d => activeCoordinates[d] === coordinates[d]);

        const dimensionLabel = (coordinates) =>
            Object.keys(contentDimensions)
                .map(dimName => {
                    const preset = contentDimensions[dimName]?.presets?.[coordinates[dimName]];
                    return preset?.label ?? coordinates[dimName] ?? dimName;
                })
                .join(' / ');

        const statusOrder = {occupied: 0, shineThrough: 1, missing: 2};
        const sortedVariants = [...variants].sort((a, b) => {
            const ac = isCurrentVariant(a.coordinates), bc = isCurrentVariant(b.coordinates);
            if (ac && !bc) return -1;
            if (!ac && bc) return 1;
            return (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
        });

        const options = sortedVariants.map(variant => {
            const isCurrent = !!isCurrentVariant(variant.coordinates);
            const cfg = STATUS_CONFIG[variant.status] ?? STATUS_CONFIG.missing;
            return {
                value: variant.coordinates,
                label: dimensionLabel(variant.coordinates),
                secondaryLabel: i18nRegistry.translate(`Flowpack.NodeVariantSelector:Main:status.${variant.status}`),
                title: `${dimensionLabel(variant.coordinates)} – ${i18nRegistry.translate(`Flowpack.NodeVariantSelector:Main:tooltip.${variant.status}`)}`,
                imageUri: statusImageUri(cfg.color),
                icon: isCurrent ? cfg.icon : undefined,
            };
        });

        const currentVariant = variants.find(v => isCurrentVariant(v.coordinates));
        const currentValue = currentVariant?.coordinates ?? options[0]?.value ?? null;

        return (
            <SelectBox
                id="__neos__nodeVariantsSelector"
                options={options}
                value={currentValue}
                onValueChange={coordinates => this.props.selectPreset(coordinates)}
                ListPreviewElement={SelectBox_Option_MultiLineWithThumbnail}
            />
        );
    }
}

const ConnectedNodeVariantSelector = connect(
    state => ({
        focusedNode: selectors.CR.Nodes.focusedSelector(state),
        contentDimensions: state.cr.contentDimensions.byName,
        activeDimensions: state.cr.contentDimensions.active
    }),
    {selectPreset: actions.CR.ContentDimensions.selectPreset}
)(NodeVariantSelector);

export default neos(globalRegistry => ({
    i18nRegistry: globalRegistry.get('i18n'),
    dataSourcesDataLoader: globalRegistry.get('dataLoaders').get('DataSources')
}))(ConnectedNodeVariantSelector);
