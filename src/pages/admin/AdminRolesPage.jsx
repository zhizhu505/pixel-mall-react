import { useContext, useMemo, useState } from 'react';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { ServiceContext } from '../../contexts/ServiceContext';
import { useServiceSnapshot } from '../../hooks/useServices';

const createRoleForm = (role) => ({
  permissions: [...(role?.permissions || [])],
  menus: [...(role?.menus || [])],
});

const AdminRolesPage = () => {
  const { admin, api } = useContext(ServiceContext);
  const roles = useServiceSnapshot(admin, (service) => service.getRoles());
  const permissionCatalog = useServiceSnapshot(admin, (service) => service.getPermissionCatalog());
  const menuCatalog = useServiceSnapshot(admin, (service) => service.getMenuCatalog());
  const initialRole = roles[0] || null;
  const [selectedRoleId, setSelectedRoleId] = useState(initialRole?.id || '');
  const [form, setForm] = useState(createRoleForm(initialRole));
  const [message, setMessage] = useState('');
  const [viewingRoleId, setViewingRoleId] = useState(null);

  const groupedPermissions = useMemo(() => {
    return permissionCatalog.reduce((groups, permission) => {
      const groupKey = permission.group;
      const currentGroup = groups[groupKey] || {
        key: groupKey,
        label: permission.groupLabel,
        items: [],
      };

      currentGroup.items.push(permission);
      groups[groupKey] = currentGroup;
      return groups;
    }, {});
  }, [permissionCatalog]);

  const activeRoleId = roles.some((role) => role.id === selectedRoleId) ? selectedRoleId : initialRole?.id || '';
  const selectedRole = roles.find((role) => role.id === activeRoleId) || initialRole;
  const viewingRole = viewingRoleId ? roles.find((role) => role.id === viewingRoleId) : null;

  const syncSelectedRole = (preferredRoleId = selectedRoleId) => {
    const nextRoles = admin.getRoles();
    const nextRole = nextRoles.find((role) => role.id === preferredRoleId) || nextRoles[0] || null;
    setSelectedRoleId(nextRole?.id || '');
    setForm(createRoleForm(nextRole));
    return nextRole;
  };

  if (!roles.length) {
    return <EmptyState title="暂无角色" description="当前没有可展示的后台角色。" iconSrc="/images/admin/role/admin-badge.svg" />;
  }

  const togglePermission = (permissionKey) => {
    setForm((current) => {
      const hasPermission = current.permissions.includes(permissionKey);
      const nextPermissions = hasPermission
        ? current.permissions.filter((permission) => permission !== permissionKey)
        : [...current.permissions, permissionKey];

      const nextMenus = current.menus.filter((menuKey) => {
        const menu = menuCatalog.find((item) => item.key === menuKey);
        return menu ? nextPermissions.includes(menu.permission) : true;
      });

      return {
        permissions: nextPermissions,
        menus: nextMenus,
      };
    });
  };

  const toggleMenu = (menuKey) => {
    setForm((current) => ({
      ...current,
      menus: current.menus.includes(menuKey)
        ? current.menus.filter((key) => key !== menuKey)
        : [...current.menus, menuKey],
    }));
  };

  const handleSave = async () => {
    const result = await api.admin.updateRoleAccess(activeRoleId, form);
    if (result.success) {
      syncSelectedRole(activeRoleId);
    }
    setMessage(result.message);
  };

  const handleResetCurrent = () => {
    if (!selectedRole) {
      return;
    }

    setForm({
      permissions: [...selectedRole.permissions],
      menus: [...selectedRole.menus],
    });
    setMessage('当前角色改动已撤销。');
  };

  const handleRestoreDefaults = async () => {
    const result = await api.admin.resetRoles();
    syncSelectedRole(activeRoleId);
    setMessage(result.message);
  };

  const handleRefresh = async () => {
    await api.admin.reload();
    syncSelectedRole(activeRoleId);
    setMessage('角色数据已刷新。');
  };

  return (
    <div className="pm-admin-roles-page">
      <div className="pm-admin-page-header">
        <div>
          <h2 className="pm-section-title">角色权限配置</h2>
          <p className="pm-help">编辑现有系统角色的菜单范围与权限点，保存后会直接影响后台菜单和访问控制。</p>
        </div>
        <div className="pm-admin-inline-actions">
          <Button type="button" variant="ghost" onClick={handleRefresh}>刷新</Button>
          <Button type="button" variant="ghost" onClick={handleRestoreDefaults}>恢复默认</Button>
        </div>
      </div>

      {message ? <div className="pm-alert">{message}</div> : null}

      <div className="pm-role-workspace">
        <section className="pm-role-list">
          {roles.map((role) => {
            const isActive = role.id === activeRoleId;
            return (
              <button
                key={role.id}
                className={`pm-role-card pm-role-card-button${isActive ? ' is-active' : ''}`}
                type="button"
                onClick={() => {
                  setSelectedRoleId(role.id);
                  setForm(createRoleForm(role));
                }}
              >
                <div>
                  <h3 className="pm-admin-card-title">{role.name}</h3>
                  <p className="pm-help">角色标识：{role.id}</p>
                </div>
                <p className="pm-role-description">{role.description}</p>
                <div className="pm-role-meta">
                  <span>{role.menuCount} 个菜单</span>
                  <span>{role.permissionCount} 个权限</span>
                </div>
                <div className="pm-admin-inline-actions">
                  <Button type="button" variant="ghost" onClick={(event) => {
                    event.stopPropagation();
                    setViewingRoleId(role.id);
                  }}>
                    查看详情
                  </Button>
                </div>
              </button>
            );
          })}
        </section>

        {selectedRole ? (
          <section className="pm-admin-panel pm-role-editor">
            <div className="pm-role-editor-head">
              <div>
                <h3 className="pm-section-title">{selectedRole.name}</h3>
                <p className="pm-help">{selectedRole.description}</p>
              </div>
              <div className="pm-admin-inline-actions">
                <Button type="button" variant="ghost" onClick={handleResetCurrent}>撤销改动</Button>
                <Button type="button" onClick={handleSave}>保存配置</Button>
              </div>
            </div>

            <section className="pm-role-section">
              <div>
                <h4 className="pm-label">权限点</h4>
                <p className="pm-help">权限决定是否允许访问页面或执行管理操作。</p>
              </div>
              <div className="pm-role-group-list">
                {Object.values(groupedPermissions).map((group) => (
                  <article className="pm-role-group-card" key={group.key}>
                    <h5 className="pm-role-group-title">{group.label}</h5>
                    <div className="pm-role-toggle-list">
                      {group.items.map((permission) => {
                        const checked = form.permissions.includes(permission.key);
                        return (
                          <label className={`pm-role-toggle${checked ? ' is-checked' : ''}`} key={permission.key}>
                            <input
                              checked={checked}
                              type="checkbox"
                              onChange={() => togglePermission(permission.key)}
                            />
                            <span>{permission.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="pm-role-section">
              <div>
                <h4 className="pm-label">可见菜单</h4>
                <p className="pm-help">菜单项必须先具备对应的查看权限，未勾选查看权限的菜单会自动禁用。</p>
              </div>
              <div className="pm-role-toggle-list pm-role-menu-list">
                {menuCatalog.map((menu) => {
                  const checked = form.menus.includes(menu.key);
                  const disabled = !form.permissions.includes(menu.permission);
                  return (
                    <label className={`pm-role-toggle${checked ? ' is-checked' : ''}${disabled ? ' is-disabled' : ''}`} key={menu.key}>
                      <input
                        checked={checked}
                        disabled={disabled}
                        type="checkbox"
                        onChange={() => toggleMenu(menu.key)}
                      />
                      <span>{menu.label}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          </section>
        ) : null}
      </div>

      <Modal
        cancelText=""
        confirmText=""
        onClose={() => setViewingRoleId(null)}
        onConfirm={() => setViewingRoleId(null)}
        open={Boolean(viewingRole)}
        title="角色详情"
      >
        {viewingRole ? (
          <div className="pm-admin-panel pm-admin-detail-panel">
            <div className="pm-admin-detail-grid">
              <div>
                <p className="pm-label">角色名称</p>
                <h3 className="pm-admin-card-title">{viewingRole.name}</h3>
              </div>
              <div>
                <p className="pm-label">角色标识</p>
                <p>{viewingRole.id}</p>
              </div>
              <div>
                <p className="pm-label">菜单数量</p>
                <p>{viewingRole.menuCount}</p>
              </div>
              <div>
                <p className="pm-label">权限数量</p>
                <p>{viewingRole.permissionCount}</p>
              </div>
            </div>
            <div>
              <p className="pm-label">角色说明</p>
              <p className="pm-admin-detail-copy">{viewingRole.description}</p>
            </div>
            <div>
              <p className="pm-label">菜单列表</p>
              <div className="pm-admin-detail-chip-row">
                {viewingRole.menus.map((menuKey) => {
                  const menu = menuCatalog.find((item) => item.key === menuKey);
                  return <span className="pm-tag pm-tag-info" key={menuKey}>{menu?.label || menuKey}</span>;
                })}
              </div>
            </div>
            <div>
              <p className="pm-label">权限列表</p>
              <div className="pm-admin-detail-chip-row">
                {viewingRole.permissions.map((permissionKey) => {
                  const permission = permissionCatalog.find((item) => item.key === permissionKey);
                  return <span className="pm-tag pm-tag-sale" key={permissionKey}>{permission?.label || permissionKey}</span>;
                })}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default AdminRolesPage;
