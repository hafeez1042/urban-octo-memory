import { BrowserRouter, Route, Routes } from "react-router";

const TemplateHome = () => (
  <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
    <section className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">Reusable application template</p>
      <h1 className="text-3xl font-semibold">Start building</h1>
      <p className="max-w-xl text-muted-foreground">
        Add feature routes under <code>src/features</code> and connect them through services, query hooks,
        and shared contracts.
      </p>
    </section>
  </main>
);

export const AppRoutes = () => (
  <Routes>
    <Route path="*" element={<TemplateHome />} />
  </Routes>
);

export const AppRouter = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);
