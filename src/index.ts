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
 * and does nothing more.
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
 * function that converts a JSON response to a `Person`:
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
export type ResponseOf<T, CustomMapping extends Mapping<T> = never> = [
  CustomMapping
] extends [never]
  ? Expand<ReplacePrimitives<T, CustomMapping>>
  : ApplyMapping<CustomMapping, ReplacePrimitives<T, CustomMapping>>

type ReplacePrimitives<
  T,
  TNotNull = Exclude<T, null>,
  TNotUndefined = Exclude<T, undefined>,
  TStrict = Exclude<T, null | undefined>
> = T extends null
  ? ReplacePrimitives<TNotNull> | null
  : T extends undefined
  ? ReplacePrimitives<TNotUndefined> | undefined
  : TStrict extends string | number | boolean
  ? TStrict
  : TStrict extends Date
  ? string
  : [TStrict] extends [Mappable]
  ? { [K in keyof TStrict]: ReplacePrimitives<TStrict[Exclude<K, undefined>]> }
  : unknown

/**
 * Mappings of the properties of `T` to custom types.
 */
export type Mapping<T> = { [key in keyof T]?: any }

/**
 * Applies the given {@link Mapping} to `T`. `T` must be an object of type
 * `Record<string, unknown>`.
 */
export type ApplyMapping<M extends Mapping<T>, T> = T extends Record<
  string,
  unknown
>
  ? Expand<ApplyOptionalMapping<M, T> & ApplyRequiredMapping<M, T>>
  : T

type ApplyOptionalMapping<M extends Mapping<T>, T extends Mappable> = {
  [K in keyof PickOptionalProperties<T> as undefined extends ApplyMappingToProperty<
    M,
    T,
    string & K
  >
    ? K
    : never]?: ApplyMappingToProperty<M, T, string & K>
} & {
  [K in keyof PickOptionalProperties<T> as undefined extends ApplyMappingToProperty<
    M,
    T,
    string & K
  >
    ? never
    : K]: ApplyMappingToProperty<M, T, string & K>
}

type ApplyRequiredMapping<M extends Mapping<T>, T extends Mappable> = {
  [K in keyof PickRequiredProperties<T> as undefined extends ApplyMappingToProperty<
    M,
    T,
    string & K
  >
    ? never
    : K]: ApplyMappingToProperty<M, T, string & K>
}

type ApplyMappingToProperty<
  Map extends Mapping<Obj>,
  Obj extends Mappable,
  Prop extends keyof Obj,
  ValueIsMappable = Obj[Prop] extends Mappable ? true : false,
  ValueIsArray = Obj[Prop] extends Array<unknown> ? true : false,
  SubMapping = true extends ValueIsMappable
    ? unknown extends Map[Prop]
      ? {}
      : Map[Prop]
    : never,
  AppliedSubMapping = ApplyMapping<SubMapping, Obj[Prop]>
> = unknown extends Map[Prop]
  ? Obj[Prop]
  : false extends ValueIsMappable
  ? Map[Prop]
  : true extends ValueIsArray
  ? Map[Prop]
  : AppliedSubMapping

type Mappable = Record<string, any>

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]

type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>

type Primitive = string | number | boolean | undefined | null

type PickOptionalProperties<T> = T extends Primitive
  ? T
  : T extends Array<infer U>
  ? PickOptionalPropertiesArray<U>
  : PickOptionalPropertiesObject<T>

interface PickOptionalPropertiesArray<T>
  extends ReadonlyArray<PickOptionalProperties<T>> {}

type PickOptionalPropertiesObject<T> = {
  [P in OptionalKeys<T>]: T[P]
}

type PickRequiredProperties<T> = T extends Record<string, unknown>
  ? PickRequiredPropertiesObject<T>
  : T

type PickRequiredPropertiesObject<T> = {
  [P in RequiredKeys<T>]: T[P]
}

type Expand<T> = T extends Record<string, unknown>
  ? { [K in keyof T]: Expand<T[K]> }
  : T
