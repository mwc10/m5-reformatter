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

    public static Ok<T, E>(d: T): Result<T, E> {
        return new Result<T, E>(d, ResultState.Ok)
    }
    public static Err<T, E>(err: E): Result<T, E> {
        return new Result<T, E>(err, ResultState.Err)
    }
    public is_err(): boolean {
        return this.kind === ResultState.Err ? 
            true : false
    }
    public is_ok(): boolean {
        return this.kind === ResultState.Ok ?
            true : false
    }
    public map<S>(fn: (ok: T) => S): Result<S, E> {
        switch (this.kind) {
            case ResultState.Ok:
                return Result.Ok(fn(this.value as T))
            case ResultState.Err:
                return Result.Err(this.value as E)
        }
    }
    public map_err<F>(fn: (err: E) => F): Result<T, F> {
        switch (this.kind) {
            case ResultState.Err:
                return Result.Err(fn(this.value as E))
            case ResultState.Ok:
                return Result.Ok(this.value as T)
        }
    }
    public to_promise(): Promise<T> {
        switch (this.kind) {
            case ResultState.Ok:
                return Promise.resolve(this.value as T)
            case ResultState.Err:
                return Promise.reject(this.value as E)
        }
    }
    public attempt(fn: () => T): Result<T, E> {
        try {
            return Result.Ok(fn())
        } catch (e) {
            return Result.Err(e)
        }
    }
    public unwrap(): T {
        switch (this.kind) {
            case ResultState.Ok:
                return this.value as T
            case ResultState.Err:
                throw Error("tried to unwrap an Err Result")
        }
    }

    public unwrap_err(): E {
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
