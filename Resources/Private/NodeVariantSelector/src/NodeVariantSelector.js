import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {$get} from 'plow-js';
import isEqual from 'lodash.isequal';

import {Headline, Icon, SelectBox} from '@neos-project/react-ui-components';

import I18n from '@neos-project/neos-ui-i18n';

import {actions, selectors} from '@neos-project/neos-ui-redux-store';
import {neos} from '@neos-project/neos-ui-decorators';

@neos(globalRegistry => ({
    nodeTypesRegistry: globalRegistry.get('@neos-project/neos-ui-contentrepository'),
    i18nRegistry: globalRegistry.get('i18n')
}))
@connect(state => {
    return {
        focusedNode: selectors.CR.Nodes.focusedSelector(state),
        focusedNodeParentLine: selectors.CR.Nodes.focusedNodeParentLineSelector(state),
        contentDimensions: $get('cr.contentDimensions.byName', state)
    };
}, {
    focusNode: actions.CR.Nodes.focus,
    selectPreset: actions.CR.ContentDimensions.selectPreset
})
export default class SelectedElement extends PureComponent {
    static propTypes = {
        focusedNode: PropTypes.object.isRequired,
        focusedNodeParentLine: PropTypes.object.isRequired,
        nodeTypesRegistry: PropTypes.object.isRequired
    };

    handleSelectNode = selectedNodeContextPath => {
        const {focusNode, focusedNode} = this.props;

        if (selectedNodeContextPath && selectedNodeContextPath !== $get('contextPath', focusedNode)) {
            focusNode(selectedNodeContextPath);
        }
    };

    createNodeOption = node => {
        const {nodeTypesRegistry} = this.props;
        const nodeType = $get('nodeType', node);

        return {
            icon: $get('ui.icon', nodeTypesRegistry.get(nodeType)),
            label: $get('label', node),
            value: $get('contextPath', node)
        };
    }

    render() {
        const {focusedNode, contentDimensions, i18nRegistry} = this.props;
        const focusedNodeVariants = $get('otherNodeVariants', focusedNode);
        if (!focusedNodeVariants) {
            return null;
        }

        const matchesCurrentDimensions = $get('matchesCurrentDimensions', focusedNode);
        const contextPath = $get('contextPath', focusedNode);
        let uriDimensions = {};
        if (matchesCurrentDimensions) {
            try {
                let uriDimensionsArray = contextPath.split(';')[1].split('&');
                uriDimensionsArray.map((dimension) => {
                    let dimensionValues = dimension.split('=');
                    let retval = {};
                    retval[dimensionValues[0]] = dimensionValues[1].split(',')[0];
                    uriDimensions[dimensionValues[0]] = dimensionValues[1].split(',')[0];
                    return retval;
                });
            } catch (e) {
                // ignore..
            }
        }

        let nodeVariantOptions = [];

        const currentVariantOption = (state) => ({
            value: $get('dimensions', focusedNode),
            label: (
                <div title={state === 'matching' ? i18nRegistry.translate('Flowpack.NodeVariantSelector:Main:matchingTooltip')
                    : (state === 'shinethrough' ? i18nRegistry.translate('Flowpack.NodeVariantSelector:Main:shinethroughTooltip')
                        : '')}>
                    {state === 'matching' ? (<Icon icon="check-circle" padded="right" color="primaryBlue"/>) : ''}
                    {state === 'shinethrough' ? (<Icon icon="exclamation-circle" padded="right" color="warn"/>) : ''}
                    {Object.keys(contentDimensions).map((dimensionName) => {
                        const dimensionValue = contentDimensions[dimensionName];
                        const dimensionPresetId = $get(['dimensions', dimensionName], focusedNode);
                        const presetLabel = $get([dimensionName, 'presets', dimensionPresetId, 'label'], contentDimensions);
                        return (
                            <span key={dimensionName} style={{marginRight: 20, fontWeight: 'bold'}}>
                                <Icon title={i18nRegistry.translate($get('label', dimensionValue))}
                                      icon={$get('icon', dimensionValue)} padded="right"/>
                                <I18n id={presetLabel}/>
                            </span>
                            );
                    })}
                </div>
            )
        });

        const currentTranslationOption = () => ({
            value: uriDimensions,
            label: (
                <div title={i18nRegistry.translate('Flowpack.NodeVariantSelector:Main:translatingTooltip')}>
                    <Icon icon="sync" padded="right" color="primaryBlue"/>
                    {Object.keys(uriDimensions).map((dimension) => {
                        const dimensionName = dimension;
                        const dimensionValue = uriDimensions[dimension];
                        const dimensionPresetId = uriDimensions[dimension];
                        const presetLabel = $get([dimensionName, 'presets', dimensionPresetId, 'label'], contentDimensions);
                        return (
                            <span key={dimensionName} style={{marginRight: 20, fontWeight: 'bold'}}>
                                <I18n id={presetLabel}/>
                            </span>
                        );
                    })}
                </div>
            )
        });

        const otherVariantsOptions = () => focusedNodeVariants.map(nodeVariant => {
            return {
                value: nodeVariant,
                label: (
                    <div title="">
                        {Object.keys(contentDimensions).map((dimensionName) => {
                            const dimensionValue = contentDimensions[dimensionName];
                            const dimensionPresetId = $get(dimensionName, nodeVariant);
                            const presetLabel = $get([dimensionName, 'presets', dimensionPresetId, 'label'], contentDimensions);
                            return (<span key={dimensionName} style={{marginRight: 20}}>
                                <Icon icon={$get('icon', dimensionValue)} padded="right"/>
                                <I18n id={presetLabel}/>
                            </span>);
                        })}
                    </div>
                )
            };
        });

        if (isEqual(uriDimensions, $get('dimensions', focusedNode))) {
            // Dimensions are equal in URL and Node - Node is already translated
            try {
                nodeVariantOptions = [...nodeVariantOptions, currentVariantOption('matching')];
            } catch (e) {
                // ignore..
            }
        } else if($get('matchesCurrentDimensions', focusedNode)) {
            // Dimensions are NOT equal in URL and Node - It's already translated but the browser is not reloaded yet
            try {
                nodeVariantOptions = [...nodeVariantOptions, currentTranslationOption()];
            } catch (e) {
                // ignore..
            }
            try {
                nodeVariantOptions = [...nodeVariantOptions, currentVariantOption('matching')];
            } catch (e) {
                // ignore..
            }
        } else {
            // Dimensions are NOT equal in URL and Node - It's a Shadow-Node and does need a Translation
            try {
                nodeVariantOptions = [...nodeVariantOptions, currentVariantOption('shinethrough')];
            } catch (e) {
                // ignore..
            }
        }

        try {
            // Always show otherVariantsOptions
            nodeVariantOptions = [...nodeVariantOptions, ...otherVariantsOptions()];
        } catch (e) {
            // ignore..
        }

        return (
            <SelectBox
                id="__neos__nodeVariantsSelector"
                options={nodeVariantOptions}
                value={$get([0, 'value'], nodeVariantOptions)}
                onValueChange={preset => this.props.selectPreset(preset)}
            />
        );
    }
}
