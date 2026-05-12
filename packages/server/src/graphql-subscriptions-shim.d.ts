declare module "graphql-subscriptions" {
    export class PubSub {
        publish(triggerName: string, payload: any): void;
        subscribe(triggerName: string, onMessage: (payload: any) => void): void;
    }
}
