enum ResultState {
    Ok,
    Err
}

export class Result<T, E>{
    private value: T | E;
    private kind: ResultState;

    private constructor(data: T | E, kind: ResultState) {
        this.value = data;
        this.kind = kind;
    }

    static Ok<T, E>(d: T): Result<T, E> {
        return new Result<T, E>(d, ResultState.Ok)
    }
    static Err<T, E>(err: E): Result<T, E> {
        return new Result<T, E>(err, ResultState.Err)
    }
    static attempt<T, E>(fn: () => T): Result<T, E> {
        try {
            return Result.Ok(fn())
        } catch (e) {
            return Result.Err(e)
        }
    }
    is_err(): boolean {
        return this.kind === ResultState.Err ? 
            true : false
    }
    is_ok(): boolean {
        return this.kind === ResultState.Ok ?
            true : false
    }
    map<S>(fn: (ok: T) => S): Result<S, E> {
        switch (this.kind) {
            case ResultState.Ok:
                return Result.Ok(fn(this.value as T))
            case ResultState.Err:
                return Result.Err(this.value as E)
        }
    }
    map_err<F>(fn: (err: E) => F): Result<T, F> {
        switch (this.kind) {
            case ResultState.Err:
                return Result.Err(fn(this.value as E))
            case ResultState.Ok:
                return Result.Ok(this.value as T)
        }
    }
    and_then<S, F>(fn: (v: T) => Result<S, F>): Result<S, E | F> {
        switch (this.kind) {
            case ResultState.Ok:
                return fn(this.value as T)
            case ResultState.Err:
                return Result.Err(this.value as E)
        }
    }
    to_promise(): Promise<T> {
        switch (this.kind) {
            case ResultState.Ok:
                return Promise.resolve(this.value as T)
            case ResultState.Err:
                return Promise.reject(this.value as E)
        }
    }
    
    unwrap(): T {
        switch (this.kind) {
            case ResultState.Ok:
                return this.value as T
            case ResultState.Err:
                throw Error("tried to unwrap an Err Result")
        }
    }

    unwrap_err(): E {
        switch (this.kind) {
            case ResultState.Err:
                return this.value as E
            case ResultState.Ok:
                throw Error("tried to unwrap_err an Ok Result")
        }
    }
}

export const Err = Result.Err
export const Ok = Result.Ok 

export class Option<T> {
    value: T | undefined

    constructor(value: T) {
        this.value = value
    }
    static Some<T>(val: T): Option<T> {
        return new Option(val)
    }
    static None<T>(): Option<T> {
        return new Option(undefined)
    }
    static attempt<T>(fn: () => T): Option<T> {
        const val = fn()
        return val === null || val === undefined ? 
            Option.None() :
            Option.Some(val)
    }
    is_some(this: Option<T>): boolean {
        return !(this.value === undefined)
    }
    map<S>(fn: (v: T) => S): Option<S> {
        return this.is_some() ? 
            Option.Some(fn(this.value as T)) :
            Option.None()
    }
    and_then<S>(fn: (v: T) => Option<S>): Option<S> {
        return this.is_some() ? 
            fn(this.value as T) :
            Option.None()
    }
    unwrap(): T {
        if (this.is_some()) {
            return this.value
        } else {
            throw Error("called unwrap on an empty Option")
        }
    }
}

export const Some = Option.Some
export const None = Option.None
