import { expectType } from 'tsd'
import { ResponseOf } from '.'

type Person = {
  name: string
  birthday: Date
  contact: {
    email: string
    phone: string[]
    contactedAt: Date | null
  }
  social: {
    twitter?: string
  }
  tuple: [Date, string, number]
}

type DefaultResponse = ResponseOf<Person>

expectType<DefaultResponse>({
  name: 'Bob',
  birthday: '2020-01-01T00:00:00.000Z',
  contact: {
    email: '',
    phone: ['+0 123 456 789', '+1 234 567 890', '+2 345 678 901'],
    contactedAt: null as string | null,
  },
  social: {} as { twitter?: string },
  tuple: ['2020-01-01T00:00:00.000Z', 'foo', 9],
})

type MappedResponse = ResponseOf<
  Person,
  {
    name: [string, string]
    birthday: number
    contact: {
      phone: string
      contactedAt: Date | null
    }
    social: {
      twitter: string
    }
    tuple: [number, string, string]
  }
>

expectType<MappedResponse>({
  name: ['Bob', 'Belcher'],
  birthday: 1577836800000,
  contact: {
    email: 'bob@example.com',
    phone: '+0 123 456 789',
    contactedAt: null as Date | null,
  },
  social: {
    twitter: '@bob',
  },
  tuple: [1577836800000, 'foo', '9'],
})

expectType<ResponseOf<number>>(5 as number)
expectType<ResponseOf<string>>('foo' as string)
expectType<ResponseOf<Date>>('2020-01-01T00:00:00.000Z' as string)
