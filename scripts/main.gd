extends Control

const PALETTE := {
	"red": Color("#ef665f"),
	"blue": Color("#5da8ed"),
	"yellow": Color("#f2c85b"),
	"green": Color("#65c58b"),
	"purple": Color("#b18ae8")
}
const NAMES := {
	"red": "КРАСНЫЕ", "blue": "СИНИЕ", "yellow": "ЖЁЛТЫЕ",
	"green": "ЗЕЛЁНЫЕ", "purple": "ФИОЛЕТОВЫЕ"
}
const SIZE := 7
const SLOT_COUNT := 5
const CELL_SIZE := 42
const DIRS: Array[Vector2i] = [
	Vector2i(-1, 0), Vector2i(1, 0),
	Vector2i(0, -1), Vector2i(0, 1)
]

# Авторский тестовый рисунок. Пустая строка означает уже унесённый пиксель.
var board: Array = []
# Контейнеры выдаются строго по одному, в указанном порядке.
var incoming: Array[Dictionary] = []
var slots: Array = [null, null, null, null, null]
var next_container := 0
var remaining := 0
var resolving := false
var won := false
var lost := false
var active_target := Vector2i(-1, -1)
var active_slot := -1
var activity_text := ""

var board_grid: GridContainer
var slots_grid: GridContainer
var board_status: Label
var queue_status: Label
var message: Label
var restart_button: Button

func _ready() -> void:
	_reset_level()
	_build_ui()
	_refresh()

func _reset_level() -> void:
	board = [
		["green", "green", "red", "green", "purple", "yellow", "green"],
		["red", "purple", "purple", "blue", "yellow", "red", "red"],
		["red", "purple", "green", "red", "yellow", "yellow", "red"],
		["purple", "yellow", "blue", "blue", "blue", "red", "red"],
		["purple", "blue", "green", "blue", "purple", "yellow", "red"],
		["yellow", "red", "red", "blue", "red", "purple", "green"],
		["purple", "red", "blue", "green", "yellow", "yellow", "green"]
	]
	incoming = [
		{"color":"yellow", "ants":3}, {"color":"blue", "ants":4},
		{"color":"purple", "ants":2}, {"color":"blue", "ants":2},
		{"color":"red", "ants":6}, {"color":"purple", "ants":6},
		{"color":"blue", "ants":1}, {"color":"green", "ants":3},
		{"color":"purple", "ants":1}, {"color":"yellow", "ants":1},
		{"color":"green", "ants":1}, {"color":"green", "ants":5},
		{"color":"yellow", "ants":1}, {"color":"red", "ants":2},
		{"color":"yellow", "ants":4}, {"color":"blue", "ants":1},
		{"color":"red", "ants":6}
	]
	slots = [null, null, null, null, null]
	next_container = 0
	remaining = SIZE * SIZE
	resolving = false
	won = false
	lost = false
	active_target = Vector2i(-1, -1)
	active_slot = -1
	activity_text = ""

func _build_ui() -> void:
	for child in get_children():
		child.queue_free()

	var bg := ColorRect.new()
	bg.color = Color("#101a16")
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var safe := MarginContainer.new()
	safe.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	safe.add_theme_constant_override("margin_left", 12)
	safe.add_theme_constant_override("margin_right", 12)
	safe.add_theme_constant_override("margin_top", 16)
	safe.add_theme_constant_override("margin_bottom", 12)
	add_child(safe)

	var layout := VBoxContainer.new()
	layout.add_theme_constant_override("separation", 9)
	safe.add_child(layout)

	var title := Label.new()
	title.text = "🐜  МУРАВЬИШКИ"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 25)
	title.add_theme_color_override("font_color", Color("#f5d58a"))
	layout.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "ПИКСЕЛЬНАЯ ОХОТА"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 14)
	subtitle.add_theme_color_override("font_color", Color("#b9c9bd"))
	layout.add_child(subtitle)

	var level_title := Label.new()
	level_title.text = "УРОВЕНЬ 1 · ПЯТЬ ПУСКОВЫХ ЯЧЕЕК"
	level_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	level_title.add_theme_font_size_override("font_size", 15)
	level_title.add_theme_color_override("font_color", Color.WHITE)
	layout.add_child(level_title)

	board_status = Label.new()
	board_status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	board_status.add_theme_font_size_override("font_size", 14)
	board_status.add_theme_color_override("font_color", Color("#d5e2d7"))
	layout.add_child(board_status)

	var board_panel := PanelContainer.new()
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color = Color("#1a2922")
	panel_style.set_corner_radius_all(16)
	panel_style.content_margin_left = 8
	panel_style.content_margin_right = 8
	panel_style.content_margin_top = 8
	panel_style.content_margin_bottom = 8
	board_panel.add_theme_stylebox_override("panel", panel_style)
	board_panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	layout.add_child(board_panel)

	board_grid = GridContainer.new()
	board_grid.columns = SIZE
	board_grid.add_theme_constant_override("h_separation", 3)
	board_grid.add_theme_constant_override("v_separation", 3)
	board_panel.add_child(board_grid)

	var slot_title := Label.new()
	slot_title.text = "ПУСКОВЫЕ ЯЧЕЙКИ · ПРИОРИТЕТ 1 → 5"
	slot_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	slot_title.add_theme_font_size_override("font_size", 15)
	slot_title.add_theme_color_override("font_color", Color("#f5d58a"))
	layout.add_child(slot_title)

	slots_grid = GridContainer.new()
	slots_grid.columns = SLOT_COUNT
	slots_grid.add_theme_constant_override("h_separation", 5)
	layout.add_child(slots_grid)

	queue_status = Label.new()
	queue_status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	queue_status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	queue_status.add_theme_font_size_override("font_size", 14)
	queue_status.add_theme_color_override("font_color", Color("#d5e2d7"))
	layout.add_child(queue_status)

	message = Label.new()
	message.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	message.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	message.custom_minimum_size.y = 48
	message.add_theme_font_size_override("font_size", 13)
	message.add_theme_color_override("font_color", Color("#c8d8cc"))
	layout.add_child(message)

	var rule := Label.new()
	rule.text = "Автозапуск при помещении. Очерёдность обработки слева направо: ячейка 1 раньше ячейки 5. Закрытые цвета ждут открытия пикселей."
	rule.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rule.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	rule.add_theme_font_size_override("font_size", 11)
	rule.add_theme_color_override("font_color", Color("#91a69a"))
	layout.add_child(rule)

	restart_button = Button.new()
	restart_button.text = "↻  Начать заново"
	restart_button.custom_minimum_size.y = 44
	restart_button.pressed.connect(_restart)
	layout.add_child(restart_button)

func _is_accessible(x: int, y: int) -> bool:
	for direction in DIRS:
		var nx: int = x + direction.x
		var ny: int = y + direction.y
		if nx < 0 or nx >= SIZE or ny < 0 or ny >= SIZE:
			return true
		if board[ny][nx] == "":
			return true
	return false

func _find_accessible_pixel(color: String) -> Vector2i:
	for y in range(SIZE):
		for x in range(SIZE):
			if board[y][x] == color and _is_accessible(x, y):
				return Vector2i(x, y)
	return Vector2i(-1, -1)

func _refresh() -> void:
	if not is_instance_valid(board_grid):
		return
	for child in board_grid.get_children():
		child.queue_free()
	for y in range(SIZE):
		for x in range(SIZE):
			var color_name: String = board[y][x]
			var tile := Panel.new()
			tile.custom_minimum_size = Vector2(CELL_SIZE, CELL_SIZE)
			var style := StyleBoxFlat.new()
			if color_name == "":
				style.bg_color = Color("#1a2922")
				style.border_color = Color("#263a30")
			else:
				style.bg_color = PALETTE[color_name]
				style.border_color = Color("#fff0b2") if _is_accessible(x, y) else PALETTE[color_name].darkened(0.55)
			style.set_border_width_all(3 if color_name != "" and _is_accessible(x, y) else 1)
			if Vector2i(x, y) == active_target:
				style.bg_color = PALETTE[color_name].lightened(0.18)
				style.border_color = Color("#fff8d6")
				style.set_border_width_all(4)
			style.set_corner_radius_all(5)
			tile.add_theme_stylebox_override("panel", style)
			if Vector2i(x, y) == active_target:
				var ant_marker := Label.new()
				ant_marker.text = "🐜"
				ant_marker.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
				ant_marker.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
				ant_marker.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
				ant_marker.add_theme_font_size_override("font_size", 20)
				ant_marker.mouse_filter = Control.MOUSE_FILTER_IGNORE
				tile.add_child(ant_marker)
			board_grid.add_child(tile)

	for child in slots_grid.get_children():
		child.queue_free()
	for i in range(SLOT_COUNT):
		var button := Button.new()
		button.custom_minimum_size = Vector2(58, 66)
		if slots[i] == null:
			button.text = str(i + 1) + "\n＋"
			button.disabled = lost or won or resolving or next_container >= incoming.size()
		else:
			var c: String = slots[i]["color"]
			var ants: int = slots[i]["ants"]
			button.text = ("▶ " if active_slot == i else "") + str(i + 1) + "\n🐜 " + str(ants)
			button.disabled = true
			var style := StyleBoxFlat.new()
			style.bg_color = PALETTE[c].darkened(0.55)
			style.border_color = PALETTE[c]
			style.set_border_width_all(2)
			style.set_corner_radius_all(9)
			button.add_theme_stylebox_override("normal", style)
		button.pressed.connect(_place_next.bind(i))
		slots_grid.add_child(button)

	board_status.text = "Пикселей осталось: %d" % remaining
	if next_container < incoming.size():
		var upcoming: Dictionary = incoming[next_container]
		queue_status.text = "СЛЕДУЮЩИЙ КОНТЕЙНЕР: %s · %d муравьёв" % [NAMES[upcoming.color], upcoming.ants]
	else:
		queue_status.text = "Контейнеры в очереди закончились."
	if won:
		message.text = "Победа! Рисунок полностью собран муравейником! ✨"
	elif lost:
		message.text = "Поражение: все пять ячеек заняты, ходов больше нет."
	elif resolving:
		message.text = activity_text
	else:
		var free_slots := _free_slot_count()
		message.text = "Свободных пусковых ячеек: %d из %d" % [free_slots, SLOT_COUNT]

func _free_slot_count() -> int:
	var count := 0
	for slot in slots:
		if slot == null:
			count += 1
	return count

func _place_next(slot_index: int) -> void:
	if resolving or won or lost or slot_index < 0 or slot_index >= SLOT_COUNT:
		return
	if slots[slot_index] != null or next_container >= incoming.size():
		return
	slots[slot_index] = incoming[next_container].duplicate(true)
	next_container += 1
	activity_text = "Контейнер установлен — муравьи отправились за пикселями!"
	_resolve_all_slots()
	_refresh()

func _resolve_all_slots() -> void:
	if resolving:
		return
	resolving = true
	_refresh()
	var changed := true
	while changed:
		changed = false
		# Автозапуск и приоритет обработки фиксированы: слева направо.
		for i in range(SLOT_COUNT):
			if slots[i] == null:
				continue
			var container: Dictionary = slots[i]
			active_slot = i
			while int(container.ants) > 0:
				var target := _find_accessible_pixel(str(container.color))
				if target.x < 0:
					activity_text = "%s контейнер в ячейке %d ждёт открытия пикселя." % [NAMES[str(container.color)], i + 1]
					break
				active_target = target
				activity_text = "Муравей из ячейки %d забирает %s пиксель · осталось муравьёв: %d" % [i + 1, NAMES[str(container.color)].to_lower(), int(container.ants)]
				_refresh()
				await get_tree().create_timer(0.12).timeout
				board[target.y][target.x] = ""
				remaining -= 1
				container.ants = int(container.ants) - 1
				active_target = Vector2i(-1, -1)
				changed = true
				_refresh()
				await get_tree().create_timer(0.045).timeout
			if int(container.ants) <= 0:
				activity_text = "Контейнер в ячейке %d опустел — ячейка свободна." % [i + 1]
				slots[i] = null
			else:
				slots[i] = container
			active_target = Vector2i(-1, -1)
			active_slot = -1
			_refresh()
		if remaining <= 0:
			break
	if remaining <= 0:
		won = true
	elif _is_defeat():
		lost = true
	active_target = Vector2i(-1, -1)
	active_slot = -1
	resolving = false
	activity_text = ""
	_refresh()

func _is_defeat() -> bool:
	if _free_slot_count() > 0:
		return false
	# Поражение только если ни один из уже размещённых контейнеров
	# не может подобрать ни одного доступного пикселя своего цвета.
	for slot in slots:
		if slot == null:
			continue
		if _find_accessible_pixel(str(slot.color)).x >= 0 and int(slot.ants) > 0:
			return false
	return remaining > 0

func _restart() -> void:
	_reset_level()
	_build_ui()
	_refresh()
