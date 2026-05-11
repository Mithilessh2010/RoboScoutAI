import { BaseEntity, PrimaryGeneratedColumn, Column, Index, Entity } from "typeorm";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
let Analytics = class extends BaseEntity {
};
__decorateClass([
  PrimaryGeneratedColumn()
], Analytics.prototype, "id", 2);
__decorateClass([
  Column(),
  Index()
], Analytics.prototype, "url", 2);
__decorateClass([
  Column("varchar", { nullable: true }),
  Index()
], Analytics.prototype, "fromUrl", 2);
__decorateClass([
  Column(),
  Index()
], Analytics.prototype, "pathChanged", 2);
__decorateClass([
  Column(),
  Index()
], Analytics.prototype, "sessionId", 2);
__decorateClass([
  Column(),
  Index()
], Analytics.prototype, "userId", 2);
__decorateClass([
  Column(),
  Index()
], Analytics.prototype, "browser", 2);
__decorateClass([
  Column(),
  Index()
], Analytics.prototype, "deviceType", 2);
__decorateClass([
  Column("timestamptz"),
  Index()
], Analytics.prototype, "date", 2);
Analytics = __decorateClass([
  Entity()
], Analytics);
export {
  Analytics
};
