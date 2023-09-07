import { makeAutoObservable, runInAction } from 'mobx'
import { injectable } from 'tsyringe'

import { ConnectionDataItem, UpdateCustomNetwork } from '@app/models'
import { ConnectionStore, createEnumField, Drawer, Logger } from '@app/popup/modules/shared'

import { NetworkFormValue } from '../NetworkForm'

@injectable()
export class NetworkSettingsPageViewModel {

    public step = createEnumField<typeof Step>(Step.Settings)

    public network: ConnectionDataItem | undefined

    public result: UpdateResult | undefined

    public notificationVisible = false

    constructor(
        public drawer: Drawer,
        private connectionStore: ConnectionStore,
        private logger: Logger,
    ) {
        makeAutoObservable(this, undefined, { autoBind: true })
    }

    public get networks(): ConnectionDataItem[] {
        return this.connectionStore.connectionItems
    }

    public get selectedConnection(): ConnectionDataItem {
        return this.connectionStore.selectedConnection
    }

    public get canDelete(): boolean {
        return this.network?.connectionId !== this.selectedConnection.connectionId
    }

    public get canSwitch(): boolean {
        return this.network?.connectionId !== this.selectedConnection.connectionId
    }

    public async handleSubmit(value: NetworkFormValue): Promise<void> {
        const update: Partial<UpdateCustomNetwork> = {
            connectionId: this.network?.connectionId,
            type: value.type,
            name: value.name,
            config: {
                symbol: value.config.symbol || undefined,
                tokensManifestUrl: value.config.tokensManifestUrl || undefined,
                explorerBaseUrl: value.config.explorerBaseUrl || undefined,
            },
        }

        if (value.type === 'jrpc' || value.type === 'proto') {
            update.data = {
                endpoint: value.endpoints[0].value,
            }
        }
        else {
            update.data = {
                endpoints: value.endpoints.map(({ value }) => value),
                local: value.local,
                latencyDetectionInterval: 60000,
                maxLatency: 60000,
            }
        }

        const network = await this.connectionStore.updateCustomNetwork(update as UpdateCustomNetwork)

        if (this.selectedConnection.connectionId === network.connectionId) {
            this.connectionStore.changeNetwork(network).catch(this.logger.error)
        }

        runInAction(() => {
            this.result = {
                network,
                type: this.network ? 'update' : 'add',
            }
            this.step.setValue(Step.Result)
        })
    }

    public handleEdit(network: ConnectionDataItem): void {
        this.network = network
        this.step.setValue(Step.Edit)
    }

    public handleAdd(): void {
        this.network = undefined
        this.step.setValue(Step.Edit)
    }

    public async handleDelete(): Promise<void> {
        if (this.network) {
            await this.connectionStore.deleteCustomNetwork(this.network.connectionId)
        }

        this.showNotification()
        this.step.setValue(Step.Settings)
    }

    public async handleReset(): Promise<void> {
        if (this.network) {
            const defaultNetwork = await this.connectionStore.deleteCustomNetwork(this.network.connectionId)

            if (this.selectedConnection.connectionId === defaultNetwork?.connectionId) {
                this.connectionStore.changeNetwork(defaultNetwork).catch(this.logger.error)
            }
        }

        this.step.setValue(Step.Settings)
    }

    public handleBack(): void {
        this.step.setValue(Step.Settings)
    }

    public handleClose(switchNetwork: boolean): void {
        if (switchNetwork) {
            this.connectionStore.changeNetwork(this.result?.network).catch(this.logger.error)
        }

        window.close()
    }

    public async handleUndo(): Promise<void> {
        this.hideNotification()

        if (this.network) {
            const update: UpdateCustomNetwork = {
                ...this.network,
                connectionId: undefined,
            }

            await this.connectionStore.updateCustomNetwork(update)
        }
    }

    public hideNotification(): void {
        this.notificationVisible = false
    }

    public showNotification(): void {
        this.notificationVisible = true
    }

}

export enum Step {
    Settings,
    Edit,
    Result,
}

interface UpdateResult {
    type: 'add' | 'update';
    network: ConnectionDataItem;
}
