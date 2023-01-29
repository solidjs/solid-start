/// <reference path="../server/types.tsx" />

// @ts-expect-error
var fileRoutes = $FILE_ROUTES;

/**
 * Routes are the file system based routes, used by Solid App Router to show the current page according to the URL.
 */

const FileRoutes = () => {
  return fileRoutes;
};

export default FileRoutes;
export { fileRoutes };
