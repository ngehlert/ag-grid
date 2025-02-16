import { RowNode } from "../entities/rowNode";
import { Autowired, Bean, PostConstruct } from "../context/context";
import { Events, PinnedRowDataChangedEvent } from "../events";
import { Constants } from "../constants/constants";
import { ColumnApi } from "../columns/columnApi";
import { GridApi } from "../gridApi";
import { BeanStub } from "../context/beanStub";
import { missingOrEmpty } from "../utils/generic";
import { last } from "../utils/array";
import { Beans } from "../rendering/beans";

@Bean('pinnedRowModel')
export class PinnedRowModel extends BeanStub {

    @Autowired('columnApi') private columnApi: ColumnApi;
    @Autowired('gridApi') private gridApi: GridApi;
    @Autowired('beans') private beans: Beans;

    private pinnedTopRows: RowNode[];
    private pinnedBottomRows: RowNode[];

    @PostConstruct
    public init(): void {
        this.setPinnedTopRowData(this.gridOptionsWrapper.getPinnedTopRowData());
        this.setPinnedBottomRowData(this.gridOptionsWrapper.getPinnedBottomRowData());
    }

    public isEmpty(floating: string): boolean {
        const rows = floating === Constants.PINNED_TOP ? this.pinnedTopRows : this.pinnedBottomRows;
        return missingOrEmpty(rows);
    }

    public isRowsToRender(floating: string): boolean {
        return !this.isEmpty(floating);
    }

    public getRowAtPixel(pixel: number, floating: string): number {
        const rows = floating === Constants.PINNED_TOP ? this.pinnedTopRows : this.pinnedBottomRows;
        if (missingOrEmpty(rows)) {
            return 0; // this should never happen, just in case, 0 is graceful failure
        }
        for (let i = 0; i < rows.length; i++) {
            const rowNode = rows[i];
            const rowTopPixel = rowNode.rowTop! + rowNode.rowHeight! - 1;
            // only need to range check against the top pixel, as we are going through the list
            // in order, first row to hit the pixel wins
            if (rowTopPixel >= pixel) {
                return i;
            }
        }
        return rows.length - 1;
    }

    public setPinnedTopRowData(rowData: any[] | undefined): void {
        this.pinnedTopRows = this.createNodesFromData(rowData, true);
        const event: PinnedRowDataChangedEvent = {
            type: Events.EVENT_PINNED_ROW_DATA_CHANGED,
            api: this.gridApi,
            columnApi: this.columnApi
        };
        this.eventService.dispatchEvent(event);
    }

    public setPinnedBottomRowData(rowData: any[] | undefined): void {
        this.pinnedBottomRows = this.createNodesFromData(rowData, false);
        const event: PinnedRowDataChangedEvent = {
            type: Events.EVENT_PINNED_ROW_DATA_CHANGED,
            api: this.gridApi,
            columnApi: this.columnApi
        };
        this.eventService.dispatchEvent(event);
    }

    private createNodesFromData(allData: any[] | undefined, isTop: boolean): RowNode[] {
        const rowNodes: RowNode[] = [];
        if (allData) {
            let nextRowTop = 0;
            allData.forEach((dataItem: any, index: number) => {
                const rowNode = new RowNode(this.beans);
                rowNode.data = dataItem;

                const idPrefix = isTop ? RowNode.ID_PREFIX_TOP_PINNED : RowNode.ID_PREFIX_BOTTOM_PINNED;
                rowNode.id = idPrefix + index;

                rowNode.rowPinned = isTop ? Constants.PINNED_TOP : Constants.PINNED_BOTTOM;
                rowNode.setRowTop(nextRowTop);
                rowNode.setRowHeight(this.gridOptionsWrapper.getRowHeightForNode(rowNode).height);
                rowNode.setRowIndex(index);
                nextRowTop += rowNode.rowHeight!;
                rowNodes.push(rowNode);
            });
        }
        return rowNodes;
    }

    public getPinnedTopRowData(): RowNode[] {
        return this.pinnedTopRows;
    }

    public getPinnedBottomRowData(): RowNode[] {
        return this.pinnedBottomRows;
    }

    public getPinnedTopTotalHeight(): number {
        return this.getTotalHeight(this.pinnedTopRows);
    }

    public getPinnedTopRowCount(): number {
        return this.pinnedTopRows ? this.pinnedTopRows.length : 0;
    }

    public getPinnedBottomRowCount(): number {
        return this.pinnedBottomRows ? this.pinnedBottomRows.length : 0;
    }

    public getPinnedTopRow(index: number): RowNode | undefined {
        return this.pinnedTopRows[index];
    }

    public getPinnedBottomRow(index: number): RowNode | undefined {
        return this.pinnedBottomRows[index];
    }

    public forEachPinnedTopRow(callback: (rowNode: RowNode, index: number) => void): void {
        if (missingOrEmpty(this.pinnedTopRows)) {
            return;
        }
        this.pinnedTopRows.forEach(callback);
    }

    public forEachPinnedBottomRow(callback: (rowNode: RowNode, index: number) => void): void {
        if (missingOrEmpty(this.pinnedBottomRows)) {
            return;
        }
        this.pinnedBottomRows.forEach(callback);
    }

    public getPinnedBottomTotalHeight(): number {
        return this.getTotalHeight(this.pinnedBottomRows);
    }

    private getTotalHeight(rowNodes: RowNode[]): number {
        if (!rowNodes || rowNodes.length === 0) { return 0; }

        const lastNode = last(rowNodes);
        return lastNode.rowTop! + lastNode.rowHeight!;
    }
}
