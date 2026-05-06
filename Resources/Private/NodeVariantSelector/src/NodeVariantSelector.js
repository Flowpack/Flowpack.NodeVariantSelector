import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {Icon, SelectBox} from '@neos-project/react-ui-components';

import I18n from '@neos-project/neos-ui-i18n';

import {actions, selectors} from '@neos-project/neos-ui-redux-store';
import {neos} from '@neos-project/neos-ui-decorators';

const DATA_SOURCE_IDENTIFIER = 'flowpack-nodevariantselector-variants';

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

    state = {
        variants: null,
        isLoading: false
    };

    componentDidMount() {
        this.loadVariants();
    }

    componentDidUpdate(prevProps) {
        const prevPath = prevProps.focusedNode?.contextPath;
        const nextPath = this.props.focusedNode?.contextPath;
        if (prevPath !== nextPath) {
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
            {
                contextNodePath: focusedNode.contextPath,
                dataSourceIdentifier: DATA_SOURCE_IDENTIFIER,
                dataSourceDisableCaching: true
            },
            null
        ).then(variants => {
            this.setState({variants: Array.isArray(variants) ? variants : null, isLoading: false});
        }).catch(() => {
            this.setState({variants: null, isLoading: false});
        });
    }

    /**
     * Build a dimension label row for the given dimension space point coordinates.
     * @param {Object} coordinates  e.g. {language: 'de'}
     * @param {boolean} isCurrent
     */
    renderDimensionLabel(coordinates, isCurrent) {
        const {contentDimensions, i18nRegistry, focusedNode} = this.props;

        return (
            <div>
                {isCurrent && (
                    focusedNode.matchesCurrentDimensions ? (
                        <Icon
                            title={i18nRegistry.translate('Flowpack.NodeVariantSelector:Main:matchingTooltip')}
                            icon="check-circle"
                            padded="right"
                            color="primaryBlue"
                        />
                    ) : (
                        <Icon
                            title={i18nRegistry.translate('Flowpack.NodeVariantSelector:Main:shinethroughTooltip')}
                            icon="exclamation-circle"
                            padded="right"
                            color="warn"
                        />
                    )
                )}
                {Object.keys(contentDimensions).map(dimensionName => {
                    const dimensionConfig = contentDimensions[dimensionName];
                    const dimensionValue = coordinates[dimensionName];
                    const presetLabel = dimensionConfig?.presets?.[dimensionValue]?.label;
                    return (
                        <span key={dimensionName} style={{marginRight: 20, fontWeight: isCurrent ? 'bold' : 'normal'}}>
                            <Icon
                                title={i18nRegistry.translate(dimensionConfig.label)}
                                icon={dimensionConfig.icon}
                                padded="right"
                            />
                            <I18n id={presetLabel} />
                        </span>
                    );
                })}
            </div>
        );
    }

    render() {
        const {activeDimensions, contentDimensions} = this.props;
        const {variants, isLoading} = this.state;

        if (isLoading || !variants || variants.length === 0) {
            return null;
        }

        // Derive the currently active dimension space point from Redux state.
        // activeDimensions has shape {language: ['de']} – take first value per dimension.
        const activeCoordinates = activeDimensions
            ? Object.keys(contentDimensions).reduce((acc, dimName) => {
                const values = activeDimensions[dimName];
                acc[dimName] = Array.isArray(values) ? values[0] : values;
                return acc;
            }, {})
            : null;

        const options = variants.map(coordinates => {
            const isCurrent = activeCoordinates
                && Object.keys(activeCoordinates).every(
                    dimName => activeCoordinates[dimName] === coordinates[dimName]
                );
            return {
                value: coordinates,
                label: this.renderDimensionLabel(coordinates, !!isCurrent)
            };
        });

        // Put the current variant first
        options.sort((a) => {
            const aIsCurrent = activeCoordinates
                && Object.keys(activeCoordinates).every(d => activeCoordinates[d] === a.value[d]);
            return aIsCurrent ? -1 : 1;
        });

        const currentValue = options[0]?.value ?? null;

        return (
            <SelectBox
                id="__neos__nodeVariantsSelector"
                options={options}
                value={currentValue}
                onValueChange={coordinates => this.props.selectPreset(coordinates)}
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
    {
        selectPreset: actions.CR.ContentDimensions.selectPreset
    }
)(NodeVariantSelector);

export default neos(globalRegistry => ({
    i18nRegistry: globalRegistry.get('i18n'),
    dataSourcesDataLoader: globalRegistry.get('dataLoaders').get('DataSources')
}))(ConnectedNodeVariantSelector);
