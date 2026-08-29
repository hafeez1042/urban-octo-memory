export interface IBaseAttributes<I = string> {
  id?: I;
  created_at?: Date;
  updated_at?: Date;
}

export interface ISoftDeleteAttributes {
  deleted_at?: Date;
}

export interface IVersionAttributes extends ISoftDeleteAttributes {
  source_item_id?: string;
  version?: number;
  is_active?: boolean;
}

export interface IVersionedBaseAttributes<I = string>
  extends IBaseAttributes<I>,
    IVersionAttributes {}
