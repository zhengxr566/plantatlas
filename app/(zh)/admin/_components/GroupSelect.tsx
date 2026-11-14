"use client";

export const CUSTOM_GROUP = "自定义 Custom";
const NEW_GROUP = "__new__";

// tags.md 分组选择，最后一项“新建分组…”
export default function GroupSelect({
  value,
  groups,
  onChange,
  title,
  placeholder,
}: {
  value: string;
  groups: string[];
  onChange: (group: string) => void;
  title?: string;
  // 提供时显示为第一项（value 为空时选中），用于“加入到…”这类操作
  placeholder?: string;
}) {
  const names = Array.from(new Set([...groups, CUSTOM_GROUP, value].filter(Boolean)));

  return (
    <select
      className="group-select"
      value={value}
      title={title}
      onChange={(e) => {
        if (!e.target.value) return;
        if (e.target.value !== NEW_GROUP) {
          onChange(e.target.value);
          return;
        }
        const name = prompt("新分组名称（建议“中文 English”，例如：树皮 Bark）")?.trim();
        if (name) onChange(name);
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {names.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
      <option value={NEW_GROUP}>+ 新建分组…</option>
    </select>
  );
}
