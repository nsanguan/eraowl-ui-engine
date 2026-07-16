import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { DesignerPage } from "../pages/DesignerPage";
import { PreviewPage } from "../pages/PreviewPage";

const router = createBrowserRouter([
  {
    path: "/designer",
    element: <DesignerPage />,
  },
  {
    path: "/preview",
    element: <PreviewPage />,
  },
  {
    path: "*",
    element: <DesignerPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
