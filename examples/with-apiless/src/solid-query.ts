import { createResource, Resource } from "solid-js";

type FragmentGetter = <Def extends FragmentDefinition<any, any>, Input extends Def["$input"]>(
  def: Def,
  input: Input
) => Promise<FragmentData<Def>>;

export function defineQuery<T, D>(
  fn: (p: T, get: FragmentGetter) => Promise<D>
): QueryDefinition<T, D> {
  return {
    queryFn: fn
  } as any;
}

export interface QueryDefinition<T, D> {
  queryFn: (p: T, g: FragmentGetter) => D;
  $input: T;
  $data: D;
}

export interface FragmentDefinition<T, D> {
  fragmentFn: (p: T) => D;
  $input: T;
  $data: D;
}

export function createFragment<T, D>(f: (p: T) => Promise<D>): FragmentDefinition<T, D> {
  return {
    fragmentFn: f
  } as any;
}

export interface FragmentRef<T, D> {
  $data: D;
  $fragment: FragmentDefinition<T, D>;
}

export function useQuery<Q extends QueryDefinition<any, any>, I extends Q["$input"]>(
  def: Q,
  input: I | (() => I)
) {
  return createResource<Q["$data"], Q["$input"]>(input, i => {
    const get: FragmentGetter = async (def, input) => {
      let data = await def.fragmentFn(input);
      return data;
    };
    return def.queryFn(i, get);
  });
}

export type FragmentData<D extends FragmentDefinition<any, any>> = D;

export const useFragment = <F extends FragmentDefinition<any, any>>(
  def: F,
  ref: any
): Resource<F["$data"]> => {
  const [data] = createResource(
    () => (ref === undefined ? null : ref()),
    () => {
      console.log(ref);
      return ref();
    }
  );
  return data;
};
