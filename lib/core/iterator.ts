import { IIterator, ITeratorConfig } from "../types";

/**
 * @description Iterator allows sequential traversal through a complex data structure without exposing its internal details.
 * Make any array an iterator using this class.
 */
 export class Iterator<T> implements IIterator<T> {
	private currentIndex: number;
	private readonly items: Array<T>;
	private lastCommand: 'next' | 'prev' | 'none';
	private readonly returnCurrentOnReversion: boolean;
	private readonly restartOnFinish: boolean;

	private constructor(config?: ITeratorConfig<T>) {
		this.currentIndex = -1;
		this.items = config?.initialData ?? [];
		this.lastCommand = 'none';
		this.returnCurrentOnReversion = !!config?.returnCurrentOnReversion;
		this.restartOnFinish = !!config?.restartOnFinish;
	}

	public static create<U>(config?: ITeratorConfig<U>): Iterator<U> {
		return new Iterator<U>(config);
	}

	removeItem(item: T) : void {
		const index = this.items.findIndex((value) => JSON.stringify(item) === JSON.stringify(value));
		if (index !== -1) {
			this.items.splice(index, 1);
			if (index >= this.currentIndex) this.prev();
		}
	}

	hasNext(): boolean {
		if (this.isEmpty()) return false;
		return (this.currentIndex + 1) < this.items.length;
	}
	
	hasPrev(): boolean {
		if (this.isEmpty()) return false;
		return (this.currentIndex - 1) >= 0;
	}
	
	isEmpty(): boolean {
		return this.total() === 0;
	}

	next(): T {
		if (this.hasNext()) {
			if (this.lastCommand === 'prev' && this.currentIndex === 0) {
				this.lastCommand = 'next';
				return this.items[this.currentIndex];
			}
			const next = (this.currentIndex + 1);
			this.currentIndex = next;
			this.lastCommand = this.returnCurrentOnReversion ? 'next' : 'none';
			return this.items[next];
		};
		if (!this.restartOnFinish) return null as unknown as T;
		this.toFirst();
		return this.first();
	}
	
	prev(): T {
		if (this.hasPrev()) {
			if (this.lastCommand === 'next' && this.currentIndex === this.total() - 1) {
				this.lastCommand = 'prev';
				return this.items[this.currentIndex];
			}
			const prev = (this.currentIndex - 1);
			this.currentIndex = prev;
			this.lastCommand = this.returnCurrentOnReversion ? 'prev' : 'none';
			return this.items[prev];
		};
		if (!this.restartOnFinish) return null as unknown as T;
		this.toLast();
		return this.last();
	}

	first(): T {
		return this.items.at(0) as T;
	}

	last(): T {
		return this.items.at(-1) as T;
	}
	
	toFirst(): Iterator<T> {
		if (this.currentIndex === 0 || this.currentIndex === -1) {
			this.currentIndex = -1;
			return this;
		}
		this.currentIndex = 0;
		return this;
	}

	toLast(): Iterator<T> {
		if (this.currentIndex === this.total() - 1 || this.currentIndex === -1) {
			this.currentIndex = this.total();
			return this;
		}
		this.currentIndex = this.total() - 1;
		return this;
	}

	clear(): Iterator<T> {
		this.items.splice(0, this.total())
		this.currentIndex = -1;
		return this;
	}

	addToEnd(data: T): Iterator<T> {
		this.items.push(data);
		return this;
	}

	add(data: T): Iterator<T> {
		return this.addToEnd(data);
	}
	
	addToStart(data: T): Iterator<T> {
		this.currentIndex = -1;
		this.items.unshift(data);
		return this;
	}

	removeLast(): Iterator<T> {
		if (this.currentIndex >= this.total()) this.currentIndex -= 1;
		this.items.pop();
		return this;
	}

	removeFirst(): Iterator<T> {
		if (this.currentIndex > 0) this.currentIndex -= 1;
		this.items.shift();
		return this;
	}
	
	clone(): IIterator<T> {
		return Iterator.create({
			initialData: this.toArray(),
			restartOnFinish: this.restartOnFinish,
			returnCurrentOnReversion: this.returnCurrentOnReversion
		})
	}
	/**
	 * @description Get elements on state as array.
	 * @returns array of items on state.
	 */
	toArray(): Array<T> {
		return [...this.items];
	}

	/**
	 * @description Count total of items on state.
	 * @returns total of items on state.
	 */
	total(): number {
		return this.items.length;
	}
 }

export default Iterator;
