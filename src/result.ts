enum ResultState {
    Ok,
    Err
}

export class Result<T, E>{
    res: T | E;
    kind: ResultState;

    private constructor(data: T | E, kind: ResultState) {
        this.res = data;
        this.kind = kind;
    }

    public static Ok<T, E>(d: T): Result<T, E> {
        return new Result<T, E>(d, ResultState.Ok)
    }
    public static Err<T, E>(err: E): Result<T, E> {
        return new Result<T, E>(err, ResultState.Err)
    }
    public map<S>(fn: (ok: T) => S): Result<S, E> {
        switch (this.kind) {
            case ResultState.Ok:
                const data = this.res as T
                return Result.Ok(fn(data))
            case ResultState.Err:
                let err = this.res as E
                return Result.Err(err)
        }
    }
    public map_err<F>(fn: (err: E) => F): Result<T, F> {
        switch (this.kind) {
            case ResultState.Err:
                const err = this.res as E
                return Result.Err(fn(err))
            case ResultState.Ok:
                let data = this.res as T
                return Result.Ok(data)
        }
    }
    public to_promise(): Promise<T> {
        switch (this.kind) {
            case ResultState.Ok:
                return Promise.resolve(this.res as T)
            case ResultState.Err:
                return Promise.reject(this.res as E)
        }
    }
}

export const Err = Result.Err
export const Ok = Result.Ok 
