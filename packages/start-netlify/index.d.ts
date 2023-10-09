export type SolidStartNetlifyOptions = {
    /**
     * @default false
     */
    edge?: boolean;
};

export default function (props?: SolidStartNetlifyOptions): import("solid-start/vite").Adapter;
