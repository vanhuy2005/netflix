declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.jpeg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.gif" {
  const content: string;
  export default content;
}

declare module "*.webp" {
  const content: string;
  export default content;
}

// Allow importing plain JS/JSX modules without type declarations
declare module "*.js" {
  const content: any;
  export default content;
}

declare module "*.jsx" {
  const content: any;
  export default content;
}

// Allow TypeScript to accept imports for modules without declarations (quick fix for migration)
// Specific quick declarations for local JS/JSX modules used without types
declare module "../../config/firebase" {
  export const auth: any;
  const firebase: any;
  export default firebase;
}

declare module "../Search/SearchOverlay" {
  const component: any;
  export default component;
}
