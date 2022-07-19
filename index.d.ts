/**
 * `ResponseOf<T>` is the type `T`, normalized to primitive types that are
 * supported by JSON.
 *
 * If `T` is a primitive type, then `ResponseOf<T> == T`.
 * If `T` is an object, then each property of `T` is recursively normalized to
 * a primitive type.
 *
 * ## Examples
 *
 * ### Default mapping
 *
 * By default, `ResponseOf<T>` recursively replaces {@link Date} with `string`
 * and nothing more.
 *
 * ```ts
 * type Foo = {
 *  a: string
 *  b: number
 *  c: boolean
 *  d: Date
 *  e: {
 *    g: {
 *      h: Date
 *    }
 *    i: [string, number, Date]
 *  }
 *
 * ResponseOf<Foo> == {
 *  a: string
 *  b: number
 *  c: boolean
 *  d: string // Dates are normalized to strings by default
 *  e: {
 *    g: {
 *      h: string // types are mapped recursively
 *    }
 *    i: [string, number, string] // Arrays and tuples are also mapped
 *  }
 * ```
 *
 * ### Custom mapping
 *
 * You can provide a custom mapping for each field of `T` as the second generic
 * type. When provided, the mapping overrides the default mapping for type `T`.
 *
 * ```ts
 * type Person = {
 *   name: string
 *   age: string
 *   birthdate: Date
 *   contact: {
 *     email: string
 *     lastContacted: Date
 *   }
 * }
 *
 * type Mapping = {
 *   age: number
 *   birthdate: number
 *   contact: {
 *     lastContacted: { // if for example an API returns dates as objects with a `timestamp` property
 *       timestamp: number
 *     }
 *   }
 * }
 *
 * ResponseOf<Person, Mapping> == {
 *   name: string
 *   age: number
 *   birthdate: number
 *   contact: {
 *     email: string
 *     lastContacted: {
 *       timestamp: number
 *     }
 *   }
 * }
 * ```
 *
 * Given the example above, we can write a strongly-typed `hydratePerson`
 * function that converts an JSON response to a `Person`:
 *
 * ```ts
 * function hydratePerson(data: ResponseOf<Person, Mapping>): Person {
 *   return {
 *     ...data,
 *     age: `${data.age} years`
 *     birthdate: new Date(data.birthdate),
 *     contact: {
 *       ...data.contact,
 *       lastContacted: new Date(data.contact.lastContacted.timestamp),
 *     },
 *   }
 * }
 * ```
 */
export type ResponseOf<
  T,
  CustomMapping = T extends Mappable ? Mapping<T> : never,
  ActualMapping = CustomMapping extends never ? {} : CustomMapping
> = T extends string
  ? string
  : T extends Date
  ? string
  : T extends number
  ? T
  : T extends boolean
  ? T
  : T extends Mappable
  ? ApplyMapping<
      ActualMapping,
      {
        [K in keyof T]: null extends T[K]
          ? T[K] extends Date | null
            ? string
            : ResponseOf<T[K]> | undefined
          : ResponseOf<T[K]>
      }
    >
  : string

/**
 * Mappings of the properties of `T` to custom types.
 */
export type Mapping<T extends Mappable> = { [key in keyof T]?: any }

/**
 * Applies the given {@link Mapping} to `T`. `T` must be an object of type
 * `{ [key: string]: string }` / `Record<string, string>`.
 */
export type ApplyMapping<M extends Mapping<T>, T extends Mappable> = {
  [K in keyof T]: ApplyMappingTo<M, T, K>
}

type ApplyMappingTo<
  M extends Mapping<T>,
  T extends Mappable,
  K extends keyof T,
  IsMappable = T[K] extends Mappable ? true : false, // check if `T[K]` is mappable, but not an array or tuple
  IsMappableObject = T[K] extends Mappable
    ? T[K] extends [...any]
      ? false
      : true
    : false, // check if `T[K]` is an object
  SubMapping = true extends IsMappable // if `T[K]` is mappable, extract its sub-mapping `M[K]`
    ? unknown extends M[K]
      ? {}
      : M[K]
    : never, // otherwise set it to `never`
  // if AppliedSubMapping is not `never`, then `T[K]` is mappable (object)
  AppliedSubMapping = SubMapping extends never // if `SubMapping` is `never`,
    ? never // set it to `never`
    : ApplyMapping<SubMapping, T[K]> // otherwise apply `SubMapping` to `T[K]`
  // AppliedArrayMapping = T[K] extends [...infer TT] ? ApplyMapping<M, TT> : never
> = unknown extends M[K] // if no mapping is defined for `T[K]`,
  ? T[K] // we return the original type `T[K]`
  : true extends IsMappableObject // otherwise, if `T[K]` is also mappable, but not an array or tuple
  ? AppliedSubMapping // return the applied sub-mapping of `T[K]`
  : // we now know that the mapping `M[K]` is defined for `T[K]` and that `T[K]`
    // is a primitive or array/tuple, so we just return the mapping `M[K]`
    M[K]

type Mappable = Record<string, any>
