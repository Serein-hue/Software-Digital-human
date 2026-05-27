CREATE TABLE `yc_app`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '应用名称',
  `sub_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '应用服标题',
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '应用图标',
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '1 正常 2禁用',
  `sort` int(11) NULL DEFAULT 0 COMMENT '排序',
  `content_instruct` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '内容指令 （备用）',
  `role_instruct` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '角色指令（别用）',
  `points` int(11) NULL DEFAULT 0 COMMENT '扣除点数',
  `type` char(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '应用类型',
  `result` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `tableData` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '应用' ROW_FORMAT = Dynamic;

ALTER TABLE `yc_category` COMMENT = '分类';

ALTER TABLE `yc_tags` COMMENT = '单页';

CREATE TABLE `yc_use_app_record`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_id` int(11) NULL DEFAULT NULL COMMENT '应用ID',
  `type` char(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '应用分类',
  `app_type` char(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `uid` int(11) NULL DEFAULT NULL COMMENT '所属用户',
  `points` int(11) NULL DEFAULT 0 COMMENT '请求扣除点数',
  `req_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '请求参数',
  `rep_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '响应参数',
  `error` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `status` int(1) NULL DEFAULT 1 COMMENT '1 生成中 2生成成功  3生成失败',
  `result` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '应用工具使用记录' ROW_FORMAT = Dynamic;

ALTER TABLE `yc_works` COMMENT = '作品';



INSERT INTO `yc_menu` (`id`, `parentId`, `path`, `component`, `redirect`, `type`, `title`, `svgIcon`, `icon`, `keepAlive`, `hidden`, `sort`, `activeMenu`, `breadcrumb`, `status`, `showInTabs`, `alwaysShow`, `permission`, `create_time`, `update_time`) VALUES (36, 27, '/app/app', 'app/index', '', 2, '智能工具', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-06-20 15:07:36', '2025-06-20 15:07:36');

INSERT INTO `yc_menu` (`id`, `parentId`, `path`, `component`, `redirect`, `type`, `title`, `svgIcon`, `icon`, `keepAlive`, `hidden`, `sort`, `activeMenu`, `breadcrumb`, `status`, `showInTabs`, `alwaysShow`, `permission`, `create_time`, `update_time`) VALUES (37, 0, '/order', 'Layout', '', 1, '订单管理', 'menu-data', '', 0, 0, 0, 1, 1, 1, 1, 1, '', '2025-06-24 17:40:56', '2025-06-24 17:40:56');

INSERT INTO `yc_menu` (`id`, `parentId`, `path`, `component`, `redirect`, `type`, `title`, `svgIcon`, `icon`, `keepAlive`, `hidden`, `sort`, `activeMenu`, `breadcrumb`, `status`, `showInTabs`, `alwaysShow`, `permission`, `create_time`, `update_time`) VALUES (38, 37, '/order/index', 'order/index', '', 2, '订单列表', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-06-24 17:41:25', '2025-06-24 17:41:25');

INSERT INTO `yc_menu` (`id`, `parentId`, `path`, `component`, `redirect`, `type`, `title`, `svgIcon`, `icon`, `keepAlive`, `hidden`, `sort`, `activeMenu`, `breadcrumb`, `status`, `showInTabs`, `alwaysShow`, `permission`, `create_time`, `update_time`) VALUES (39, 27, '/app/record', 'app/record/index', '', 2, '创作记录', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-06-24 17:55:57', '2025-06-24 17:56:21');

UPDATE `yc_menu` SET `parentId` = 8, `path` = '/system/pay', `component` = 'system/pay', `redirect` = '', `type` = 1, `title` = '支付配置', `svgIcon` = '', `icon` = 'IconCloud', `keepAlive` = 0, `hidden` = 0, `sort` = 0, `activeMenu` = 1, `breadcrumb` = 1, `status` = 1, `showInTabs` = 1, `alwaysShow` = 1, `permission` = '', `create_time` = '2025-05-29 18:17:37', `update_time` = '2025-05-29 18:18:54' WHERE `id` = 16;

UPDATE `yc_menu` SET `parentId` = 27, `path` = '/app/tags', `component` = 'Layout', `redirect` = '', `type` = 1, `title` = '单页管理', `svgIcon` = '', `icon` = '', `keepAlive` = 0, `hidden` = 0, `sort` = 0, `activeMenu` = 1, `breadcrumb` = 1, `status` = 1, `showInTabs` = 1, `alwaysShow` = 1, `permission` = '', `create_time` = '2025-06-03 18:34:23', `update_time` = '2025-06-04 11:55:26' WHERE `id` = 31;
