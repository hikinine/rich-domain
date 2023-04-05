import { AutoMapper, ID, Iterator, ValueObject } from "../../lib/core";
import { UID } from "../../lib/types";

describe('auto-mapper', () => {

	describe('value-object', () => {

		it('should convert value to a simple string', () => {

			class StringVo extends ValueObject<{ value: string }> {
				constructor(props: { value: string }) {
					super(props);
				}
			}

			const vo = new StringVo({ value: 'hello' });

			const autoMapper = new AutoMapper();
			const result = autoMapper.valueObjectToObj(vo);
			console.log(vo)

			expect(result).toBe('hello');

		});

		it('should convert value to an object if result has more than one key', () => {

			class StringVo extends ValueObject<{ value: string, age: number }> {
				constructor(props: { value: string, age: number }) {
					super(props);
				}
			}

			const vo = new StringVo({ value: 'hello', age: 21 });

			const autoMapper = new AutoMapper();

			const result = autoMapper.valueObjectToObj(vo);

			expect(result).toEqual({ value: 'hello', age: 21 });

		});

		it('should get boolean with success', () => {

			class StringVo extends ValueObject<{ value: string, isActive: boolean }> {
				constructor(props: { value: string, isActive: boolean }) {
					super(props);
				}
			}

			const vo1 = new StringVo({ value: 'hello', isActive: true });
			const vo2 = new StringVo({ value: 'hello', isActive: false });

			const autoMapper = new AutoMapper();

			const result1 = autoMapper.valueObjectToObj(vo1);
			const result2 = autoMapper.valueObjectToObj(vo2);

			expect(result1).toEqual({ value: 'hello', isActive: true });
			expect(result2).toEqual({ value: 'hello', isActive: false });

		});

		it('should convert array and value to a simple object', () => {

			class StringVo extends ValueObject<{ value: string, notes: number[] }> {
				constructor(props: { value: string, notes: number[] }) {
					super(props);
				}
			}

			const vo = new StringVo({ value: 'hello', notes: [1, 2, 3, 4, 5, 6, 7] });
			const autoMapper = new AutoMapper();
			const result = autoMapper.valueObjectToObj(vo);
			expect(result).toEqual({ value: 'hello', notes: [1, 2, 3, 4, 5, 6, 7] });

		});

		it('should get array from value object', () => {

			class StringVo extends ValueObject<{ value: any }> {
				constructor(props: { value: any }) {
					super(props);
				}
			}

			const vo = new StringVo({ value: [1, 2, 3, 4, 5, 6, 7] });

			const autoMapper = new AutoMapper();

			const result = autoMapper.valueObjectToObj(vo);

			expect(result).toEqual([1, 2, 3, 4, 5, 6, 7]);

		});

		it('should get id value from value object', () => {

			class StringVo extends ValueObject<{ value: any }> {
				constructor(props: { value: any }) {
					super(props);
				}
			}

			const vo = new StringVo({ value: ID.create('3c5738cf-825e-48b7-884d-927be849b0b6') });
			const autoMapper = new AutoMapper();
			const result = autoMapper.valueObjectToObj(vo);
			expect(result).toBe('3c5738cf-825e-48b7-884d-927be849b0b6');
		});

		it('should get ids value from value object', () => {
			class StringVo extends ValueObject<{ value: any }> {
				constructor(props: { value: any }) {
					super(props);
				}
			}

			const ids = Iterator.create({ initialData: ['927be849b0b1', '927be849b0b2', '927be849b0b3'] });

			const IDS: UID<string>[] = [];

			while (ids.hasNext()) {
				IDS.push(ID.create(ids.next()));
			}

			const vo = new StringVo({ value: IDS });

			const autoMapper = new AutoMapper();

			const result = autoMapper.valueObjectToObj(vo);

			expect(result).toEqual(["927be849b0b1", "927be849b0b2", "927be849b0b3"]);

		});
	})
})