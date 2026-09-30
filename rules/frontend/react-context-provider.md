# React Context

Use for low-frequency global state (auth, theme, user session). For high-frequency updates use a state management library.

```typescript
const FooContext = createContext<FooContextType | undefined>(undefined);

export const FooProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<FooType | null>(null);
  return <FooContext.Provider value={{ state, setState }}>{children}</FooContext.Provider>;
};

export const useFoo = () => {
  const ctx = useContext(FooContext);
  if (!ctx) throw new Error("useFoo must be used within FooProvider");
  return ctx;
};
```

- Never export the context object directly — export the hook and provider only
- Providers mount in `src/App.tsx` or the nearest feature where they're needed
