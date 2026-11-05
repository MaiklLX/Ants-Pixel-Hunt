extends SceneTree

var failed := false

func _initialize() -> void:
	call_deferred("_run")

func _check(condition: bool, label: String) -> void:
	if condition:
		print("PASS: ", label)
	else:
		push_error("FAIL: " + label)
		failed = true

func _run() -> void:
	var packed := load("res://scenes/main.tscn") as PackedScene
	if packed == null:
		push_error("FAIL: main scene could not be loaded")
		quit(1)
		return

	var game := packed.instantiate()
	root.add_child(game)
	await process_frame

	# Boundary pixels are always accessible.
	_check(game._is_accessible(0, 0), "board-edge pixel is accessible")

	# A fully surrounded pixel is blocked until one orthogonal neighbor clears.
	for y in range(game.SIZE):
		for x in range(game.SIZE):
			game.board[y][x] = "red"
	_check(not game._is_accessible(3, 3), "surrounded pixel is inaccessible")
	game.board[3][2] = ""
	_check(game._is_accessible(3, 3), "cleared orthogonal neighbor unlocks pixel")

	# Pixel search must return only a matching accessible color.
	for y in range(game.SIZE):
		for x in range(game.SIZE):
			game.board[y][x] = "red"
	game.board[0][0] = "blue"
	var blue_target: Vector2i = game._find_accessible_pixel("blue")
	_check(blue_target == Vector2i(0, 0), "matching accessible pixel is found")
	_check(game._find_accessible_pixel("purple") == Vector2i(-1, -1), "missing color returns no target")

	# Defeat requires five occupied slots and no available matching move.
	for y in range(game.SIZE):
		for x in range(game.SIZE):
			game.board[y][x] = "blue"
	game.remaining = game.SIZE * game.SIZE
	game.slots = [
		{"color":"red", "ants":1},
		{"color":"red", "ants":1},
		{"color":"red", "ants":1},
		{"color":"red", "ants":1},
		{"color":"red", "ants":1}
	]
	_check(game._is_defeat(), "five blocked containers with pixels remaining means defeat")
	game.slots[0] = {"color":"blue", "ants":1}
	_check(not game._is_defeat(), "one available matching move prevents defeat")
	game.slots[0] = null
	_check(not game._is_defeat(), "a free launch slot prevents defeat")

	game.queue_free()
	if failed:
		push_error("Gameplay rules smoke test failed.")
		quit(1)
	else:
		print("Gameplay rules smoke test passed.")
		quit(0)
