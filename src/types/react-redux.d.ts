// Type declarations for redux
declare module 'redux' {
    export interface Dispatch<A = any> {
        <T extends A>(action: T): T;
    }

    export interface Store<S = any, A = any> {
        getState(): S;
        dispatch: Dispatch<A>;
        subscribe(listener: () => void): () => void;
        replaceReducer(nextReducer: Reducer<S, A>): void;
    }

    export interface Reducer<S = any, A = any> {
        (state: S | undefined, action: A): S;
    }

    export interface Action<T = any> {
        type: T;
    }

    export interface Middleware<DispatchExt = {}, S = any, D extends Dispatch = Dispatch> {
        (api: MiddlewareAPI<D, S>): (next: D) => (action: any) => any;
    }

    export interface MiddlewareAPI<D extends Dispatch = Dispatch, S = any> {
        dispatch: D;
        getState(): S;
    }
}

// Type declarations for react-redux to resolve module not found errors
declare module 'react-redux' {
    import { Dispatch, Store } from 'redux';
    import { ComponentType, ReactNode } from 'react';

    export interface DispatchProp<A = any> {
        dispatch?: Dispatch<A>;
    }

    export interface RootState extends Object { }

    export interface UseSelectorOptions<S = RootState> {
        equalityFn?: (a: any, b: any) => boolean;
        stabilityCheck?: boolean;
    }

    export function useDispatch<A extends Dispatch = Dispatch<any>>(): Dispatch<A>;
    export function useSelector<S = RootState, T = unknown>(
        selector: (state: S) => T,
        options?: UseSelectorOptions<S>
    ): T;

    export function useStore<S = RootState>(): Store<S>;

    export interface ConnectOptions {
        forwardRef?: boolean;
        pure?: boolean;
        areStatesEqual?: (nextState: RootState, prevState: RootState) => boolean;
        areOwnPropsEqual?: (nextOwnProps: any, prevOwnProps: any) => boolean;
        areStatePropsEqual?: (nextStateProps: any, prevStateProps: any) => boolean;
        areMergedPropsEqual?: (nextMergedProps: any, prevMergedProps: any) => boolean;
        mergeProps?: (stateProps: any, dispatchProps: any, ownProps: any) => any;
        optionName?: string;
    }

    export interface ConnectedProps<T> {
        [key: string]: any;
    }

    export interface InferableComponentEnhancer<TProps> {
        <P extends TProps>(component: ComponentType<P>): ComponentType<P>;
    }

    export function connect<TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, TMergedProps = {}>(
        mapStateToProps?: (state: RootState, ownProps: TOwnProps) => TStateProps,
        mapDispatchToProps?: ((dispatch: Dispatch<any>, ownProps: TOwnProps) => TDispatchProps) | TDispatchProps,
        mergeProps?: (stateProps: TStateProps, dispatchProps: TDispatchProps, ownProps: TOwnProps) => TMergedProps,
        options?: ConnectOptions
    ): InferableComponentEnhancer<TMergedProps>;

    export function connect<TStateProps = {}, TDispatchProps = {}, TOwnProps = {}>(
        mapStateToProps?: (state: RootState, ownProps: TOwnProps) => TStateProps,
        mapDispatchToProps?: ((dispatch: Dispatch<any>, ownProps: TOwnProps) => TDispatchProps) | TDispatchProps,
        mergeProps?: (stateProps: TStateProps, dispatchProps: TDispatchProps, ownProps: TOwnProps) => any,
        options?: ConnectOptions
    ): InferableComponentEnhancer<any>;

    export function connect(mapStateToProps?: (state: RootState) => any, mapDispatchToProps?: any, mergeProps?: any, options?: ConnectOptions): any;

    export function connect(
        mapStateToProps?: (state: RootState, ownProps?: any) => any,
        mapDispatchToProps?: ((dispatch: Dispatch<any>) => any) | any,
        mergeProps?: any,
        options?: ConnectOptions
    ): any;

    export interface ProviderProps<A = RootState> {
        store: Store<A>;
        children: ReactNode;
    }

    export class Provider<A = RootState> extends React.Component<ProviderProps<A>> { }
}