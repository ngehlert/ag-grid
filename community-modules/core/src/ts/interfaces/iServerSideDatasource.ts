// we pass a VO of the column and not the column itself,
// so the data is read to be be converted to JSON and thrown
// over the wire
import { RowNode } from "../entities/rowNode";
import { ColumnVO } from "./iColumnVO";
import { LoadSuccessParams } from "../rowNodeCache/rowNodeBlock";
import { SortModelItem } from "../sortController";
import { AgGridCommon } from "./iCommon";

export interface IServerSideGetRowsRequest {
    /** First row requested or undefined for all rows. */
    startRow: number | undefined;
    /** Last row requested or undefined for all rows. */
    endRow: number | undefined;
    /** Columns that are currently row grouped.  */
    rowGroupCols: ColumnVO[];
    /** Columns that have aggregations on them.  */
    valueCols: ColumnVO[];
    /** Columns that have pivot on them.  */
    pivotCols: ColumnVO[];
    /** Defines if pivot mode is on or off.  */
    pivotMode: boolean;
    /** What groups the user is viewing.  */
    groupKeys: string[];
    /** If filtering, what the filter model is.  */
    filterModel: any;
    /** If sorting, what the sort model is.  */
    sortModel: SortModelItem[];
}

export interface IServerSideGetRowsParams<TData = any> extends AgGridCommon<TData> {
    /**
     * Details for the request. A simple object that can be converted to JSON.
     */
    request: IServerSideGetRowsRequest;

    /**
     * The parent row node. The RootNode (level -1) if request is top level.
     * This is NOT part fo the request as it cannot be serialised to JSON (a rowNode has methods).
     */
    parentNode: RowNode;

    /**
     * @deprecated Use `success` method instead and return result as a `LoadSuccessParams` object.
     */
    successCallback(rowsThisPage: any[], lastRow: number): void;
    /**
     * Success callback, pass the rows back to the grid that were requested.
     */
    success(params: LoadSuccessParams): void;

    /**
     * @deprecated Use `fail` instead.
     */
    failCallback(): void;
    /**
     * Fail callback, tell the grid the call failed so it can adjust it's state.
     */
    fail(): void;

}

// datasource for Server Side Row Model
export interface IServerSideDatasource {
    /**
     * Grid calls `getRows` when it requires more rows as specified in the params.
     * Params object contains callbacks for responding to the request.
     */
    getRows(params: IServerSideGetRowsParams): void;
    /** Optional method, if your datasource has state it needs to clean up. */
    destroy?(): void;
}
