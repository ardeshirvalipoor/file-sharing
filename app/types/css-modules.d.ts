// Tells TypeScript what `import styles from './index.module.css'` gives back.
// esbuild turns each class in the file into a unique name and hands them over
// in this object, so two components can both call a class `.title` without
// clashing.
declare module '*.module.css' {
    const classes: Record<string, string>
    export default classes
}
