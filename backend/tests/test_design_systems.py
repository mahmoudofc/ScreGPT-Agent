import json
from pathlib import Path

import pytest

from prompts.builtin_design_system import (
    BUILTIN_DESIGN_SYSTEM_CONTENT,
    BUILTIN_DESIGN_SYSTEM_ID,
)
from routes.design_systems import (
    CreateDesignSystemRequest,
    UpdateDesignSystemRequest,
    builtin_design_systems,
    create_design_system,
    delete_design_system,
    get_design_systems_file_path,
    list_design_systems,
    seed_builtin_design_system,
    update_design_system,
)


@pytest.mark.asyncio
async def test_design_system_crud_persists_to_backend_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("SCREENSHOT_TO_CODE_DATA_DIR", str(tmp_path))

    assert await list_design_systems() == []

    created = await create_design_system(
        CreateDesignSystemRequest(name="Legal SaaS", content="Use .mockup-frame")
    )

    assert created.name == "Legal SaaS"
    assert created.content == "Use .mockup-frame"
    assert get_design_systems_file_path().exists()

    raw_items = json.loads(get_design_systems_file_path().read_text(encoding="utf-8"))
    assert raw_items[0]["id"] == created.id

    updated = await update_design_system(
        created.id,
        UpdateDesignSystemRequest(name="Legal Marketing", content="Use Roboto"),
    )

    assert updated.name == "Legal Marketing"
    assert updated.content == "Use Roboto"

    await delete_design_system(created.id)

    assert await list_design_systems() == []


@pytest.mark.asyncio
async def test_seed_builtin_design_system_is_idempotent(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("SCREENSHOT_TO_CODE_DATA_DIR", str(tmp_path))

    seed_builtin_design_system()

    design_systems = await list_design_systems()
    expected = builtin_design_systems()
    assert len(design_systems) == len(expected)
    # Order matches the builtin registry: signature leads, curated follow.
    assert [ds.id for ds in design_systems] == [bid for bid, _, _ in expected]
    assert design_systems[0].id == BUILTIN_DESIGN_SYSTEM_ID
    assert design_systems[0].content == BUILTIN_DESIGN_SYSTEM_CONTENT

    # A second startup seed must not duplicate any entry.
    seed_builtin_design_system()
    assert len(await list_design_systems()) == len(expected)


@pytest.mark.asyncio
async def test_seed_skips_deleted_builtin(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("SCREENSHOT_TO_CODE_DATA_DIR", str(tmp_path))

    seed_builtin_design_system()
    await delete_design_system(BUILTIN_DESIGN_SYSTEM_ID)

    remaining_ids = {ds.id for ds in await list_design_systems()}
    assert BUILTIN_DESIGN_SYSTEM_ID not in remaining_ids

    # Restarting the backend must not resurrect the deleted built-in, and must
    # not re-add the other built-ins that are still present.
    seed_builtin_design_system()
    after_reseed = await list_design_systems()
    assert BUILTIN_DESIGN_SYSTEM_ID not in {ds.id for ds in after_reseed}
    assert len(after_reseed) == len(builtin_design_systems()) - 1

