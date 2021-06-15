export interface ILabelProvider<T> {
  getText(T?): string | null;
  getSnomed(T?): string | null;
}

export interface IAdapterFactory {
  getAdapter<T>(adaptableObject: object, adapterType: string): T;

  getAdapterList(): Array<string>;
}

export interface TableElement<T> {
  position: number;
  resource: T;
}
