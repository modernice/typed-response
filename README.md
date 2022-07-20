# Typed Response

[![Test](https://github.com/modernice/typed-response/actions/workflows/test.yml/badge.svg)](https://github.com/modernice/typed-response/actions/workflows/test.yml)

This is a type-only library that can be used to automatically create an
API-compatible type of any given type.

```sh
npm i @modernice/typed-response
pnpm i @modernice/typed-response
yarn add @modernice/typed-response
```

## Examples

The library exposes a `ResponseOf` utility type that transforms a given type to
a type that can be returned by a (JSON) API. By default, this simply replaces
all occurrences of `Date` with `string`, because most APIs return dates in string
representation.

### Simple

```ts
import { ResponseOf } from '@modernice/typed-response'
import { parseISO } from 'date-fns'

interface User {
	name: string
	email: string
	createdAt: Date
	lastLogin: Date|null
}

type UserResponse = ResponseOf<User>

// UserResponse == {
// 	name: string
// 	email: string
// 	createdAt: string
// 	lastLogin: string|null
// }

function hydrateUser(data: UserResponse): User {
	return {
		...data,
		createdAt: parseISO(data.createdAt),
		lastLogin: data.createdAt ? parseISO(data.createdAt) : null,
	}
}
```

### Custom mapping

You can define a custom mapping for each (nested) property of your type.
For example, if your API returns dates as timestamps instead of strings, you can
do the following:

```ts
import { ResponseOf } from '@modernice/typed-response'

interface User {
	name: string
	email: string
	createdAt: Date
	lastLogin: Date|null
}

type UserResponse = ResponseOf<User, {
	createdAt: number
	lastLogin: number|null
}>

// UserResponse == {
// 	name: string
// 	email: string
// 	createdAt: number
// 	lastLogin: number|null
// }

function hydrateUser(data: UserResponse): User {
	return {
		...data,
		createdAt: new Date(data.createdAt),
		lastLogin: data.createdAt ? new Date(data.createdAt) : null,
	}
}
```

### Nested properties

```ts
import { ResponseOf } from '@modernice/typed-response'

interface User {
	name: string
	contact: {
		email: string
		phone?: string
	}
}

type UserResponse = ResponseOf<User, {
	name: [string, string]
	contact: {
		phone?: {
			prefix: string
			number: string
		}
	}
}>

// UserResponse == {
// 	name: [string, string]
// 	contact: {
// 		email: string
// 		phone?: {
// 			prefix: string
// 			number: string
// 		}
// 	}
// }

function hydrateUser(data: UserResponse): User {
	return {
		...data,
		name: data.name.join(' '),
		contact: {
			...data.contact,
			phone: data.phone ? `${data.phone.prefix} ${data.phone.number}` : undefined
		},
	}
}
```

## License

[MIT](./LICENSE)
