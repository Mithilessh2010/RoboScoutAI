declare module "mongoose" {
    interface Mongoose {
        model<T = any>(name: string, schema?: Schema<T>, collection?: string): any;
        connection: any;
        connections: any;
        models: any;
        Types: any;
        connect(...args: any[]): Promise<any>;
        disconnect(...args: any[]): Promise<any>;
    }

    const mongoose: Mongoose;
    export default mongoose;
    export class Schema<T = any> {
        static Types: any;
        constructor(definition?: any, options?: any);
        index(...args: any[]): any;
    }
    export function model<T = any>(name: string, schema?: Schema<T>, collection?: string): any;
    export const connection: any;
    export const connections: any;
    export const models: any;
    export const Types: any;
    export type Document = any;
    export type Model<T = any> = any;
    export type HydratedDocument<T = any> = any;
    export type InferSchemaType<T = any> = any;
    export function connect(...args: any[]): Promise<any>;
    export function disconnect(...args: any[]): Promise<any>;
}