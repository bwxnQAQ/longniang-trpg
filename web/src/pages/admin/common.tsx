import type { AdminPermission, User, Violation } from '../../api';
import type { Currency } from '../../currency';

// 管理页几个分页共用的小东西：权限判断、报错的一行、发额度时默认填的金额、违规记录的处理结果。

export const has = (u: User, ...perms: AdminPermission[]) => perms.some((p) => u.permissions.includes(p));

export function ErrorLine({ error }: { error: string }) {
  return error ? (
    <p className="form-error" role="alert">
      {error}
    </p>
  ) : null;
}

/** 发额度时默认填多少：人民币 10 元，美元 1 美元。 */
export const defaultGrant = (c: Currency) => (c === 'CNY' ? '10' : '1');

/** 金额填进输入框：最多两位小数，去掉多余的 0。 */
export const amountText = (n: number) => String(Math.round(n * 100) / 100);

/** 违规记录的处理结果（「违规记录」和账号详情里都用）。 */
export const OUTCOME_LABEL: Record<Violation['outcome'], string> = { banned: '封号了', warned: '警告了', flagged: '待查看', blocked: '拦下了（管理员）' };
