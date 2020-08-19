import * as vscode from 'vscode';

import {
    BaseTransformationItem,
    Transformation,
    TransformationCategory
} from './transformation';
import { DaCeInterface } from '../daceInterface';

export class TransformationsProvider
implements vscode.TreeDataProvider<BaseTransformationItem> {

    public static readonly CAT_SELECTION_IDX = 0;
    public static readonly CAT_VIEWPORT_IDX = 1;
    public static readonly CAT_GLOBAL_IDX = 2;
    public static readonly CAT_UNCATEGORIZED_IDX = 3;

    private static INSTANCE = new TransformationsProvider();

    private constructor() {
        this.categories = [
            new TransformationCategory(
                'Selection',
                'Transformations relevant to the current selection',
                []
            ),
            new TransformationCategory(
                'Viewport',
                'Transformations relevant to the current viewport',
                []
            ),
            new TransformationCategory(
                'Global',
                'Transformations relevant on a global scale',
                []
            ),
            new TransformationCategory(
                'Uncategorized',
                'Uncategorized transformations',
                []
            ),
        ];
        console.log(this.categories);
    }

    public static getInstance(): TransformationsProvider {
        return this.INSTANCE;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<BaseTransformationItem | undefined> =
        new vscode.EventEmitter<BaseTransformationItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<BaseTransformationItem | undefined> =
        this._onDidChangeTreeData.event;

    private categories: TransformationCategory[] = [];

    public getCategory(idx: any) {
        if (idx === TransformationsProvider.CAT_SELECTION_IDX ||
            idx === TransformationsProvider.CAT_VIEWPORT_IDX ||
            idx === TransformationsProvider.CAT_GLOBAL_IDX ||
            idx === TransformationsProvider.CAT_UNCATEGORIZED_IDX)
            return this.categories[idx];
        return undefined;
    }

    public clearTransformations() {
        for (const cat of this.categories)
            cat.clearTransformations();
    }

    public addUncategorizedTransformation(transformation: Transformation) {
        this.categories[
            TransformationsProvider.CAT_UNCATEGORIZED_IDX
        ].addTransformation(transformation);
    }

    public notifyTreeDataChanged() {
        this._onDidChangeTreeData.fire(undefined);
    }

    public refresh(element?: BaseTransformationItem): void {
        DaCeInterface.getInstance().loadTransformations();
    }

    getTreeItem(element: BaseTransformationItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: BaseTransformationItem | undefined): vscode.ProviderResult<BaseTransformationItem[]> {
        if (element) {
            let transformations = undefined;
            if (element instanceof TransformationCategory)
                transformations = element.getTransformations();
            if (transformations)
                return Promise.resolve(transformations);
            else
                return Promise.resolve(this.categories);
        }
        return Promise.resolve(this.categories);
    }

    public async sortTransformations(elements: any) {
        const viewportTransformations = [];
        const uncatTransformations = [];

        const catViewport =
            this.categories[TransformationsProvider.CAT_VIEWPORT_IDX];
        const catUncat =
            this.categories[TransformationsProvider.CAT_UNCATEGORIZED_IDX];

        let allTransformations = [];
        for (const cat of this.categories)
            for (const trafo of cat.getTransformations())
                allTransformations.push(trafo);

        for (const trafo of allTransformations) {
            let matched = false;
            if (trafo.json.state_id >= 0) {
                if (elements.states?.includes(trafo.json.state_id)) {
                    for (const element of Object.values(trafo.json._subgraph)) {
                        if (elements.nodes?.includes(Number(element))) {
                            viewportTransformations.push(trafo);
                            matched = true;
                            break;
                        }
                    }
                }
            }

            if (!matched)
                uncatTransformations.push(trafo);
        }

        catViewport.setTransformations(viewportTransformations);
        catUncat.setTransformations(uncatTransformations);

        this.notifyTreeDataChanged();
    }

}