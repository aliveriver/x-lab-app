"""
database.py
SQLAlchemy 同步 session 工厂 + SQLite 连接配置
数据库文件存放在 back/ 目录下的 x_lab.db
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# SQLite 数据库文件路径（相对于启动目录 back/）
DATABASE_URL = "sqlite:///./x_lab.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite 多线程支持
    echo=False,  # 生产可设为 False；调试时改 True 可打印 SQL
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """所有 ORM 模型的公共基类"""
    pass


def create_all_tables():
    """初始化阶段建表"""
    from models import __all_models__  # noqa: F401 — 触发所有模型文件导入，确保表被注册
    Base.metadata.create_all(bind=engine)
    _migrate_add_missing_columns()


def _migrate_add_missing_columns():
    """
    轻量级迁移：检查现有 SQLite 表，如果 ORM 模型中有新列而数据库中没有，
    自动执行 ALTER TABLE ... ADD COLUMN。
    适用于开发阶段在不删库的情况下增加字段。
    """
    with engine.connect() as conn:
        for table in Base.metadata.sorted_tables:
            # 查询当前表已有的列名
            result = conn.execute(
                __import__("sqlalchemy").text(f"PRAGMA table_info({table.name})")
            )
            existing_cols = {row[1] for row in result}  # row[1] = column name

            for col in table.columns:
                if col.name not in existing_cols:
                    # 构建默认值字符串（SQLite ALTER TABLE 只接受常量默认值）
                    if col.default is not None and col.default.is_scalar:
                        default_val = col.default.arg
                        default_clause = f" DEFAULT {default_val!r}"
                    elif not col.nullable:
                        default_clause = " DEFAULT 0"  # 非空列给一个安全默认值
                    else:
                        default_clause = ""

                    sql = f"ALTER TABLE {table.name} ADD COLUMN {col.name} {col.type.compile(engine.dialect)}{default_clause}"
                    conn.execute(__import__("sqlalchemy").text(sql))
                    conn.commit()
                    print(f"[migrate] ALTER TABLE {table.name} ADD COLUMN {col.name}")

