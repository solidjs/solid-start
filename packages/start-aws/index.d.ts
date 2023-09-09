export type SolidStartAwsOptions = {
    /**
     * @default false
     */
    edge?: boolean;
};

export default function (props?: SolidStartAwsOptions): import("solid-start/vite").Adapter;
