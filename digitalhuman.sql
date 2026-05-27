/*
 Navicat Premium Data Transfer

 Source Server         : 下次一定
 Source Server Type    : MySQL
 Source Server Version : 50744 (5.7.44-log)
 Source Host           : localhost:3306
 Source Schema         : digitalhuman_qif

 Target Server Type    : MySQL
 Target Server Version : 50744 (5.7.44-log)
 File Encoding         : 65001

 Date: 25/06/2025 10:46:39
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for yc_admin
-- ----------------------------
DROP TABLE IF EXISTS `yc_admin`;
CREATE TABLE `yc_admin`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '头像',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户账号',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '昵称',
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '密码',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 正常  2禁用',
  `role_id` int(11) NOT NULL DEFAULT 0 COMMENT '角色ID',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `is_system` tinyint(1) NULL DEFAULT 0 COMMENT '1 超级管理员 ',
  `create_time` datetime NOT NULL,
  `update_time` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '管理员' ROW_FORMAT = Dynamic;
INSERT INTO `yc_admin` VALUES (1, 'static/logo.png', 'admin', '超级管理员', '$2y$10$FrmlLB/OjKq/OhTI0f55Ve.LO3FLg1/905x.gO0lZJt3gvgbU9SsS', 1, 2, 'asdf', 1, '2025-05-21 10:58:24', '2025-05-30 17:51:06');

-- ----------------------------
-- Table structure for yc_app
-- ----------------------------
DROP TABLE IF EXISTS `yc_app`;
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
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '应用' ROW_FORMAT = Dynamic;



-- ----------------------------
-- Table structure for yc_article
-- ----------------------------
DROP TABLE IF EXISTS `yc_article`;
CREATE TABLE `yc_article`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recommend` tinyint(1) NULL DEFAULT 0,
  `category_id` int(11) NULL DEFAULT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `desc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `cover` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `status` tinyint(1) NULL DEFAULT 1,
  `sort` int(11) NULL DEFAULT 0,
  `views` int(11) NULL DEFAULT 0,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '文章' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for yc_bill
-- ----------------------------
DROP TABLE IF EXISTS `yc_bill`;
CREATE TABLE `yc_bill`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NULL DEFAULT NULL,
  `type` tinyint(1) NULL DEFAULT 0 COMMENT '1 支出 2收入',
  `number` decimal(10, 2) NULL DEFAULT NULL COMMENT '变化数量',
  `remarks` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '账单' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for yc_category
-- ----------------------------
DROP TABLE IF EXISTS `yc_category`;
CREATE TABLE `yc_category`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `sort` int(11) NULL DEFAULT 0,
  `status` tinyint(1) NULL DEFAULT 1,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '分类' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for yc_config
-- ----------------------------
DROP TABLE IF EXISTS `yc_config`;
CREATE TABLE `yc_config`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '配置' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for yc_menu
-- ----------------------------
DROP TABLE IF EXISTS `yc_menu`;
CREATE TABLE `yc_menu`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parentId` int(11) NOT NULL DEFAULT 0,
  `path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '菜单路由',
  `component` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Layout' COMMENT '文件地址',
  `redirect` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '重定向地址',
  `type` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 目录 2菜单 3按钮',
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '菜单名称',
  `svgIcon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '自定义图标',
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '图标',
  `keepAlive` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 缓存 2不缓存',
  `hidden` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 显示  2 隐藏',
  `sort` int(11) NOT NULL DEFAULT 0 COMMENT '排序',
  `activeMenu` tinyint(1) NULL DEFAULT 1,
  `breadcrumb` tinyint(1) NULL DEFAULT 1 COMMENT '1 显示面包屑 2不显示',
  `status` tinyint(1) NULL DEFAULT 1,
  `showInTabs` tinyint(1) NULL DEFAULT 1 COMMENT '1',
  `alwaysShow` tinyint(1) NULL DEFAULT 1,
  `permission` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '权限标识',
  `create_time` datetime NOT NULL,
  `update_time` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 40 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '菜单' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of yc_menu
-- ----------------------------
INSERT INTO `yc_menu` VALUES (1, 0, '/permission', 'Layout', '', 1, '权限管理', 'menu-table', '', 0, 0, 10, 1, 1, 1, 1, 0, '', '2025-05-21 14:41:17', '2025-06-07 14:22:03');
INSERT INTO `yc_menu` VALUES (2, 1, '/permission/menu', 'permission/menu/index', '', 2, '菜单管理', '', 'IconMenu', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-21 14:42:43', '2025-05-22 16:53:19');
INSERT INTO `yc_menu` VALUES (3, 1, '/permission/role', 'permission/role/index', '', 2, '角色管理', '', 'IconCommon', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-21 14:53:41', '2025-05-21 14:53:41');
INSERT INTO `yc_menu` VALUES (4, 1, '/permission/user', 'permission/user/index', '', 2, '用户管理', '', 'IconUser', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-21 14:57:46', '2025-05-21 14:57:46');
INSERT INTO `yc_menu` VALUES (5, 0, '/system', 'Layout', '', 1, '系统管理', 'menu-system', '', 0, 0, 9, 1, 1, 1, 1, 1, '', '2025-05-22 16:45:34', '2025-06-09 15:19:09');
INSERT INTO `yc_menu` VALUES (6, 5, '/system/site', 'system/site', '', 2, '站点配置', '', 'IconSettings', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-22 16:48:36', '2025-05-22 16:50:14');
INSERT INTO `yc_menu` VALUES (7, 5, '/system/upload', 'system/upload/index', '', 2, '上传配置', '', 'IconUpload', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-22 17:10:59', '2025-05-22 17:13:05');
INSERT INTO `yc_menu` VALUES (8, 0, '/platform', 'Layout', '', 1, '平台管理', 'menu-layout', '', 0, 0, 8, 1, 1, 1, 1, 0, '', '2025-05-24 17:01:22', '2025-06-09 15:19:20');
INSERT INTO `yc_menu` VALUES (9, 8, '/platform/official', 'platform/official', '', 2, '微信公众号', '', 'IconCommon', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-24 17:02:32', '2025-05-24 17:05:03');
INSERT INTO `yc_menu` VALUES (10, 8, '/platform/applet', 'platform/applet', '', 2, '微信小程序', '', 'IconRelation', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-24 17:03:27', '2025-05-24 17:04:36');
INSERT INTO `yc_menu` VALUES (11, 5, '/system/common', 'system/common', '', 2, '基础配置', '', 'IconApps', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-27 10:33:20', '2025-05-27 10:33:33');
INSERT INTO `yc_menu` VALUES (12, 5, '/system/customer', 'system/customer', '', 2, '客服配置', '', 'IconCustomerService', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-27 11:16:50', '2025-05-27 11:17:02');
INSERT INTO `yc_menu` VALUES (13, 0, '/created', 'Layout', '', 1, '创作配置', 'menu-about', '', 0, 0, 0, 1, 1, 1, 1, 1, '', '2025-05-27 17:57:15', '2025-05-27 17:59:01');
INSERT INTO `yc_menu` VALUES (14, 13, '/created/created', 'created/created', '', 2, '基础配置', '', 'IconLayers', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-27 17:58:00', '2025-05-27 17:58:58');
INSERT INTO `yc_menu` VALUES (15, 13, '/created/yiding', 'created/yiding', '', 2, '壹定平台', '', 'IconTool', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-27 18:22:06', '2025-05-27 18:26:14');
INSERT INTO `yc_menu` VALUES (16, 8, '/system/pay', 'system/pay', '', 1, '支付配置', '', 'IconCloud', 0, 0, 0, 1, 1, 1, 1, 1, '', '2025-05-29 18:17:37', '2025-05-29 18:18:54');
INSERT INTO `yc_menu` VALUES (17, 16, '/system/pay/wechat', 'system/pay/wechat', '', 2, '微信支付', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-29 18:18:11', '2025-05-30 14:29:02');
INSERT INTO `yc_menu` VALUES (18, 0, '/marketing', 'Layout', '', 1, '营销管理', 'menu-document', '', 0, 0, 0, 1, 1, 1, 1, 1, '', '2025-05-30 15:15:41', '2025-05-30 15:17:38');
INSERT INTO `yc_menu` VALUES (19, 18, '/marketing/plans', 'marketing/plans/index', '', 1, '充值套餐', '', 'IconBarChart', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-30 15:17:23', '2025-05-30 15:17:23');
INSERT INTO `yc_menu` VALUES (20, 0, '/digitalhuman', 'Layout', '', 1, '创作管理', 'backtop', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-30 16:10:53', '2025-05-30 16:10:53');
INSERT INTO `yc_menu` VALUES (21, 20, '/digitalhuman/scene', 'digitalhuman/scene/index', '', 2, '场景管理', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-30 16:11:24', '2025-05-30 16:11:24');
INSERT INTO `yc_menu` VALUES (22, 20, '/digitalhuman/voice', 'digitalhuman/voice/index', '', 2, '音色管理', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-30 16:12:10', '2025-05-30 16:12:10');
INSERT INTO `yc_menu` VALUES (23, 20, '/digitalhuman/works', 'digitalhuman/works/index', '', 2, '创作管理', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-30 16:12:39', '2025-06-09 15:21:07');
INSERT INTO `yc_menu` VALUES (24, 0, '/user', 'Layout', '', 1, '用户管理', 'icon-user', '', 0, 0, 0, 1, 1, 1, 1, 1, '', '2025-05-30 17:33:58', '2025-05-30 17:34:02');
INSERT INTO `yc_menu` VALUES (25, 24, '/user/index', 'user/index', '', 2, '用户列表', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-30 17:34:30', '2025-05-30 17:34:30');
INSERT INTO `yc_menu` VALUES (26, 24, '/user/bill', 'user/bill/index', '', 2, '用户流水', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-05-30 17:35:01', '2025-05-30 17:35:01');
INSERT INTO `yc_menu` VALUES (27, 0, '/app', 'Layout', '', 1, '应用管理', 'menu-form', '', 0, 0, 0, 1, 1, 1, 1, 1, '', '2025-06-03 16:51:19', '2025-06-03 16:54:36');
INSERT INTO `yc_menu` VALUES (28, 27, '/app/article', 'app/article', '', 1, '文章管理', '', '', 0, 0, 0, 1, 1, 1, 1, 1, '', '2025-06-03 16:52:07', '2025-06-03 16:52:07');
INSERT INTO `yc_menu` VALUES (29, 28, '/app/article/category', 'article/category/index', '', 2, '文章分类', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-06-03 16:53:22', '2025-06-03 16:53:22');
INSERT INTO `yc_menu` VALUES (30, 28, '/app/article/index', 'article/index', '', 2, '文章列表', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-06-03 16:53:51', '2025-06-03 16:53:51');
INSERT INTO `yc_menu` VALUES (31, 27, '/app/tags', 'Layout', '', 1, '单页管理', '', '', 0, 0, 0, 1, 1, 1, 1, 1, '', '2025-06-03 18:34:23', '2025-06-04 11:55:26');
INSERT INTO `yc_menu` VALUES (32, 31, '/app/tags/privacy', 'tags/index', '', 2, '隐私协议', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-06-03 18:35:42', '2025-06-03 18:35:42');
INSERT INTO `yc_menu` VALUES (33, 31, '/app/tags/service', 'tags/index', '', 2, '服务协议', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-06-04 10:08:16', '2025-06-04 10:08:16');
INSERT INTO `yc_menu` VALUES (34, 31, '/app/tags/recharge', 'tags/index', '', 2, '充值说明', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-06-06 17:49:35', '2025-06-06 17:49:35');
INSERT INTO `yc_menu` VALUES (35, 31, '/app/tags/agreement', 'tags/index', '', 2, '使用协议', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-06-07 17:27:57', '2025-06-07 17:27:57');
INSERT INTO `yc_menu` VALUES (36, 27, '/app/app', 'app/index', '', 2, '智能工具', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-06-20 15:07:36', '2025-06-20 15:07:36');
INSERT INTO `yc_menu` VALUES (37, 0, '/order', 'Layout', '', 1, '订单管理', 'menu-data', '', 0, 0, 0, 1, 1, 1, 1, 1, '', '2025-06-24 17:40:56', '2025-06-24 17:40:56');
INSERT INTO `yc_menu` VALUES (38, 37, '/order/index', 'order/index', '', 2, '订单列表', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-06-24 17:41:25', '2025-06-24 17:41:25');
INSERT INTO `yc_menu` VALUES (39, 27, '/app/record', 'app/record/index', '', 2, '创作记录', '', '', 0, 0, 0, 1, 1, 1, 1, 0, '', '2025-06-24 17:55:57', '2025-06-24 17:56:21');

-- ----------------------------
-- Table structure for yc_order
-- ----------------------------
DROP TABLE IF EXISTS `yc_order`;
CREATE TABLE `yc_order`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `wechat_order_no` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `uid` int(11) NULL DEFAULT NULL,
  `price` decimal(10, 2) NULL DEFAULT NULL,
  `plan_id` int(11) NULL DEFAULT NULL,
  `status` tinyint(1) NULL DEFAULT 0 COMMENT '0 待支付 1已支付 ',
  `points` int(11) NULL DEFAULT 0,
  `pay_time` datetime NULL DEFAULT NULL COMMENT '支付时间',
  `source` char(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '订单来源',
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '订单' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for yc_plans
-- ----------------------------
DROP TABLE IF EXISTS `yc_plans`;
CREATE TABLE `yc_plans`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `desc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `discount` decimal(4, 2) NULL DEFAULT 0.00 COMMENT '折扣',
  `price` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '价格',
  `original_price` decimal(10, 2) NULL DEFAULT 0.00,
  `points` int(11) NULL DEFAULT 0 COMMENT '获得点数',
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '1',
  `give` int(11) NULL DEFAULT 0,
  `sort` int(11) NULL DEFAULT 0,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '套餐' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for yc_role
-- ----------------------------
DROP TABLE IF EXISTS `yc_role`;
CREATE TABLE `yc_role`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '角色名称',
  `sort` int(11) NULL DEFAULT 0 COMMENT '排序',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '1 正常 2禁用',
  `is_system` tinyint(1) NULL DEFAULT 1 COMMENT '1 超级管理员 2其他',
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '角色编码',
  `menu_ids` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '角色' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for yc_scene
-- ----------------------------
DROP TABLE IF EXISTS `yc_scene`;
CREATE TABLE `yc_scene`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NOT NULL,
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `scene_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '场景ID',
  `video_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '上传地址',
  `status` tinyint(1) NULL DEFAULT 0 COMMENT '1 创建中 2已完成 3失败',
  `cover` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '封面图',
  `points` int(11) NULL DEFAULT 0,
  `task_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '场景' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for yc_tags
-- ----------------------------
DROP TABLE IF EXISTS `yc_tags`;
CREATE TABLE `yc_tags`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '单页' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for yc_upload
-- ----------------------------
DROP TABLE IF EXISTS `yc_upload`;
CREATE TABLE `yc_upload`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '文件名称',
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '文件地址',
  `size` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '文件大小',
  `md5` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '文件唯一标识',
  `ext` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '扩展名',
  `type` tinyint(1) NULL DEFAULT 1 COMMENT '1 图片  2音频  3视频 4文档  5其他',
  `adapter` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '储存器',
  `mime_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `uid` int(11) NULL DEFAULT 0 COMMENT '用户ID',
  `admin_uid` int(11) NULL DEFAULT 0 COMMENT '管理员ID',
  `hidden` tinyint(1) NULL DEFAULT 1 COMMENT '1 显示 2隐藏',
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '文件' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for yc_use_app_record
-- ----------------------------
DROP TABLE IF EXISTS `yc_use_app_record`;
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
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '应用工具使用记录' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for yc_user
-- ----------------------------
DROP TABLE IF EXISTS `yc_user`;
CREATE TABLE `yc_user`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mobile` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `password` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `openid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `official_openid` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `source` char(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `points` int(11) NULL DEFAULT 0,
  `unionid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `pid` int(11) NULL DEFAULT NULL,
  `balance` decimal(10, 2) NULL DEFAULT 0.00,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '用户' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for yc_voice
-- ----------------------------
DROP TABLE IF EXISTS `yc_voice`;
CREATE TABLE `yc_voice`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NULL DEFAULT NULL,
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '音色名称',
  `text_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '训练文本ID',
  `text_seg_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '训练文本segid',
  `task_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '任务ID',
  `voice_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '音色ID',
  `voice_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '训练音频',
  `status` tinyint(1) NULL DEFAULT 0 COMMENT '1 创建中 2已完成 3失败',
  `channel` int(1) NULL DEFAULT 1 COMMENT '1 免费语音 2深度语音 ',
  `duration` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '时长',
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '音频' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for yc_works
-- ----------------------------
DROP TABLE IF EXISTS `yc_works`;
CREATE TABLE `yc_works`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NULL DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `task_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `scene_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `voice_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `audio_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '克隆的音频地址',
  `video_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `cover` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `status` tinyint(1) NULL DEFAULT 0,
  `points` int(11) NULL DEFAULT 0,
  `duration` decimal(10, 2) NULL DEFAULT NULL,
  `channel` tinyint(1) NULL DEFAULT 1,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '作品' ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
