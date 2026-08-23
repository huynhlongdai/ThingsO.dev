from .settings import Settings


def main() -> None:
    settings = Settings()
    print(f"ThingsO worker bootstrap ready (concurrency={settings.worker_concurrency})")


if __name__ == "__main__":
    main()
