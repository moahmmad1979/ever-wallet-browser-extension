import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import { useState } from 'react'

import { NftCollection } from '@app/models'
import { Button, ButtonGroup, useViewModel } from '@app/popup/modules/shared'
import EmptyListImg from '@app/popup/assets/img/broxie-empty-list@2x.png'
import ExternalIcon from '@app/popup/assets/icons/external.svg'

import { NftItem } from '../NftItem'
import { NftGrid } from '../NftGrid'
import { NftCollectionsViewModel } from './NftCollectionsViewModel'

import './NftCollections.scss'

interface Props {
    onViewNftCollection(collection: NftCollection): void;
    onImportNft(): void;
}

export const NftCollections = observer(({ onViewNftCollection, onImportNft }: Props): JSX.Element => {
    const vm = useViewModel(NftCollectionsViewModel)
    const [layout, setLayout] = useState<'tile' | 'row'>('tile')
    const intl = useIntl()

    return (
        <div className="nft-collections">
            {vm.accountCollections.length === 0 && (
                <div className="nft-collections__empty">
                    <img className="nft-collections__empty-img" src={EmptyListImg} alt="" />
                    <h2 className="nft-collections__empty-header">
                        {intl.formatMessage({ id: 'NFT_EMPTY_LIST_HEADER' })}
                    </h2>
                    <p className="nft-collections__empty-text">
                        {intl.formatMessage({ id: 'NFT_EMPTY_LIST_TEXT' })}
                    </p>
                    <ButtonGroup className="nft-collections__btn-group" vertical>
                        <Button design="primary">
                            {/* TODO: link */}
                            {intl.formatMessage({ id: 'NFT_EMPTY_LIST_EXPLORE_BTN_TEXT' })}
                            <ExternalIcon />
                        </Button>
                        <Button design="secondary" onClick={onImportNft}>
                            {intl.formatMessage({ id: 'NFT_IMPORT_INTO_BTN_TEXT' })}
                            {vm.pendingNftCount > 0 && (
                                <span className="nft-collections__pending-count">{vm.pendingNftCount}</span>
                            )}
                        </Button>
                    </ButtonGroup>
                </div>
            )}

            {vm.accountCollections.length !== 0 && (
                <>
                    <NftGrid
                        title={intl.formatMessage({ id: 'NFT_COLLECTIONS_TITLE' })}
                        layout={layout}
                        onLayoutChange={setLayout}
                    >
                        {vm.accountCollections.map((collection) => (
                            <NftItem
                                className="nft-collections__item"
                                key={collection.address}
                                layout={layout}
                                item={collection}
                                onClick={() => onViewNftCollection(collection)}
                            />
                        ))}
                    </NftGrid>

                    <ButtonGroup className="nft-collections__btn-group" vertical>
                        <Button design="secondary" onClick={onImportNft}>
                            {intl.formatMessage({ id: 'NFT_IMPORT_INTO_BTN_TEXT' })}
                            {vm.pendingNftCount > 0 && (
                                <span className="nft-collections__pending-count">{vm.pendingNftCount}</span>
                            )}
                        </Button>
                    </ButtonGroup>
                </>
            )}
        </div>
    )
})
