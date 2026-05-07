import { Descriptor } from "../descriptor";
export declare const BarcodeElement2021: {
    readonly Duck: "Duck";
    readonly TSE: "TSE";
};
export type BarcodeElement2021 = (typeof BarcodeElement2021)[keyof typeof BarcodeElement2021];
export declare const AutoNav2021: {
    readonly None: "None";
    readonly InStorage: "InStorage";
    readonly CompletelyInStorage: "CompletelyInStorage";
    readonly InWarehouse: "InWarehouse";
    readonly CompletelyInWarehouse: "CompletelyInWarehouse";
};
export type AutoNav2021 = (typeof AutoNav2021)[keyof typeof AutoNav2021];
export declare function autoNav2021Points(nav: AutoNav2021 | null): number;
export declare const EgPark2021: {
    readonly None: "None";
    readonly InWarehouse: "InWarehouse";
    readonly CompletelyInWarehouse: "CompletelyInWarehouse";
};
export type EgPark2021 = (typeof EgPark2021)[keyof typeof EgPark2021];
export declare function egPark2021Points(park: EgPark2021 | null): number;
export declare function autoBonusPoints2021(bonus: boolean, barcode: BarcodeElement2021): number;
export declare const Descriptor2021: Descriptor;
