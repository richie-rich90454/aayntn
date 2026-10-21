/**
 * Lets the plain TypeScript compiler read the single-file components.
 *
 * The real check of a component is `vue-tsc`; this declaration is enough for
 * the type checker to follow the imports and to report the errors in the
 * ordinary TypeScript modules that the components depend on.
 */
declare module "*.vue" {
    import type { DefineComponent } from "vue";

    const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
    export default component;
}
