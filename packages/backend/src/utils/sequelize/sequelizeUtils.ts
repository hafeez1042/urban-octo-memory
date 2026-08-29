import { Model } from "sequelize";

export const getData = <T extends Model, R>(instance: T): R => {
  const response = instance.get({ plain: true });

  return response as R;
}
  

export const getDataArray = <T extends Model, R>(array: T[]): R[] =>
  array.map((instance) => getData(instance))!;
