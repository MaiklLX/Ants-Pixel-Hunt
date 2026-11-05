extends Control

const COLORS := {
	"red": Color("#f16b62"),
	"blue": Color("#62a9ed"),
	"yellow": Color("#f4c95d"),
	"green": Color("#65c58b")
}
const COLOR_NAMES := {
	"red": "КРАСНЫЕ",
	"blue": "СИНИЕ",
	"yellow": "ЖЁЛТЫЕ",
	"green": "ЗЕЛЁНЫЕ"
}
const SLOT_LIMIT := 3
const CELL_SIZE := 42

var level := [
	["red", "blue", "yellow", "red", "blue", "yellow"],
	["blue", "yellow", "red", "blue", "yellow", "red"],
	["yellow", "red", "blue", "yellow", "red", "blue"],
	["red", "blue", "yellow", "red", "blue", "yellow"],
	["blue", "yellow", "red", "blue", "yellow", "red"],
	["yellow", "red", "blue", "yellow", "red", "blue"]
]
var ant_groups: Array[Dictionary] = []
var occupied_slots: Array[String] = []
var remaining := 0
var busy := false
var game_over := false
var status_label: Label
var counter_label: Label
var slots_box: HBoxContainer
var ants_box: GridContainer
var grid_box: GridContainer
var message_label: Label
var restart_button: Button

func _ready() -> void:
	_build_level()
	_build_ui()
	_refresh_all()

func _build_level() -> void:
	remaining = 0
	for row in level:
		for color in row:
			if not color.is_empty():
				remaining += 1
	ant_groups = [
		{"color": "red", "count": 12, "used": false},
		{"color": "blue", "count": 12, "used": false},
		{"color": "yellow", "count": 12, "used": false},
		{"color": "green", "count": 4, "used": false}, # Ловушка: на поле нет зелёных пикселей.
	]
	ant_groups[0].count = 12
	ant_groups[1].count = 12

	occupied_slots.clear()
	busy = false
	game_over = false

func _build_ui() -> void:
	for child in get_children():
		child.queue_free()

	var background := ColorRect.new()
	background.color = Color("#0e1714")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var safe := MarginContainer.new()
	safe.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	safe.add_theme_constant_override("margin_left", 28)
	safe.add_theme_constant_override("margin_right", 28)
	safe.add_theme_constant_override("margin_top", 34)
	safe.add_theme_constant_override("margin_bottom", 30)
	add_child(safe)

	var layout := VBoxContainer.new()
	layout.add_theme_constant_override("separation", 18)
	safe.add_child(layout)

	var brand := Label.new()
	brand.text = "🐜  МУРАВЬИШКИ"
	brand.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	brand.add_theme_font_size_override("font_size", 27)
	brand.add_theme_color_override("font_color", Color("#f5d58a"))
	layout.add_child(brand)

	var subtitle := Label.new()
	subtitle.text = "ПИКСЕЛЬНАЯ ОХОТА"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 17)
	subtitle.add_theme_color_override("font_color", Color("#b9c9bd"))
	layout.add_child(subtitle)

	status_label = Label.new()
	status_label.text = "Уровень 1 · Сад после дождя"
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_label.add_theme_font_size_override("font_size", 19)
	status_label.add_theme_color_override("font_color", Color.WHITE)
	layout.add_child(status_label)

	counter_label = Label.new()
	counter_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	counter_label.add_theme_font_size_override("font_size", 16)
	counter_label.add_theme_color_override("font_color", Color("#c5d4c9"))
	layout.add_child(counter_label)

	var board_panel := PanelContainer.new()
	var board_style := StyleBoxFlat.new()
	board_style.bg_color = Color("#18251f")
	board_style.set_corner_radius_all(22)
	board_style.content_margin_left = 14
	board_style.content_margin_right = 14
	board_style.content_margin_top = 18
	board_style.content_margin_bottom = 18
	board_panel.add_theme_stylebox_override("panel", board_style)
	board_panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	layout.add_child(board_panel)

	grid_box = GridContainer.new()
	grid_box.columns = 6
	grid_box.add_theme_constant_override("h_separation", 5)
	grid_box.add_theme_constant_override("v_separation", 5)
	board_panel.add_child(grid_box)

	var slot_title := Label.new()
	slot_title.text = "МЕСТА ОЖИДАНИЯ  ·  " + str(SLOT_LIMIT)
	slot_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	slot_title.add_theme_font_size_override("font_size", 15)
	slot_title.add_theme_color_override("font_color", Color("#d9e3d9"))
	layout.add_child(slot_title)

	slots_box = HBoxContainer.new()
	slots_box.alignment = BoxContainer.ALIGNMENT_CENTER
	slots_box.add_theme_constant_override("separation", 12)
	layout.add_child(slots_box)

	message_label = Label.new()
	message_label.text = "Выбирай внимательно: среди команд есть пустышка. Ячеек всего три!"
	message_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	message_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	message_label.custom_minimum_size.y = 54
	message_label.add_theme_font_size_override("font_size", 15)
	message_label.add_theme_color_override("font_color", Color("#d5e2d7"))
	layout.add_child(message_label)

	var ant_title := Label.new()
	ant_title.text = "ТВОИ МУРАВЬИ"
	ant_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ant_title.add_theme_font_size_override("font_size", 15)
	ant_title.add_theme_color_override("font_color", Color("#d9e3d9"))
	layout.add_child(ant_title)

	ants_box = GridContainer.new()
	ants_box.columns = 2
	ants_box.add_theme_constant_override("h_separation", 9)
	ants_box.add_theme_constant_override("v_separation", 9)
	layout.add_child(ants_box)

	restart_button = Button.new()
	restart_button.text = "↻  Начать заново"
	restart_button.custom_minimum_size = Vector2(0, 54)
	restart_button.add_theme_font_size_override("font_size", 18)
	restart_button.pressed.connect(_restart)
	layout.add_child(restart_button)

func _refresh_all() -> void:
	if not is_instance_valid(grid_box):
		return
	for child in grid_box.get_children():
		child.queue_free()
	for row in level:
		for color in row:
			var cell := Panel.new()
			cell.custom_minimum_size = Vector2(CELL_SIZE, CELL_SIZE)
			var style := StyleBoxFlat.new()
			if color.is_empty():
				style.bg_color = Color("#26352e")
			else:
				style.bg_color = COLORS[color]
			style.set_corner_radius_all(7)
			cell.add_theme_stylebox_override("panel", style)
			grid_box.add_child(cell)

	for child in slots_box.get_children():
		child.queue_free()
	for i in range(SLOT_LIMIT):
		var slot := PanelContainer.new()
		slot.custom_minimum_size = Vector2(66, 52)
		var slot_style := StyleBoxFlat.new()
		slot_style.bg_color = Color("#26352e") if i >= occupied_slots.size() else COLORS[occupied_slots[i]].darkened(0.25)
		slot_style.set_corner_radius_all(12)
		slot.add_theme_stylebox_override("panel", slot_style)
		var label := Label.new()
		label.text = "＋" if i >= occupied_slots.size() else "🐜"
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		label.add_theme_font_size_override("font_size", 23)
		slot.add_child(label)
		slots_box.add_child(slot)

	for child in ants_box.get_children():
		child.queue_free()
	for i in range(ant_groups.size()):
		var group: Dictionary = ant_groups[i]
		var button := Button.new()
		button.custom_minimum_size = Vector2(145, 82)
		button.disabled = group.used or busy or game_over or occupied_slots.size() >= SLOT_LIMIT
		button.text = "🐜  " + COLOR_NAMES[group.color] + "\n" + str(group.count) + " муравья"
		button.add_theme_font_size_override("font_size", 14)
		var normal := StyleBoxFlat.new()
		normal.bg_color = COLORS[group.color].darkened(0.55)
		normal.set_corner_radius_all(14)
		normal.border_width_left = 3
		normal.border_width_right = 3
		normal.border_width_top = 3
		normal.border_width_bottom = 3
		normal.border_color = COLORS[group.color]
		button.add_theme_stylebox_override("normal", normal)
		button.pressed.connect(_select_group.bind(i))
		ants_box.add_child(button)

	counter_label.text = "Осталось пикселей: %d" % remaining
	if remaining == 0:
		message_label.text = "Победа! Все пиксели собраны! ✨"
	elif game_over:
		message_label.text = "Ячейки закончились! Ты выбрал лишнюю команду. Попробуй ещё раз."


func _select_group(index: int) -> void:
	if busy or game_over or remaining <= 0 or index >= ant_groups.size():
		return
	var group: Dictionary = ant_groups[index]
	if group.used:
		return
	if occupied_slots.size() >= SLOT_LIMIT:
		message_label.text = "Все места ожидания заняты!"
		return

	group.used = true
	ant_groups[index] = group
	occupied_slots.append(group.color)
	busy = true
	message_label.text = "Муравьишки спешат за добычей…"
	_refresh_all()
	await get_tree().create_timer(0.45).timeout

	var eaten := 0
	for y in range(level.size()):
		for x in range(level[y].size()):
			if level[y][x] == group.color:
				level[y][x] = ""
				eaten += 1
				remaining -= 1
				await get_tree().create_timer(0.025).timeout
				_refresh_grid_only()

	busy = false
	if remaining == 0:
		message_label.text = "Победа! Весь урожай собран! ✨"
	elif occupied_slots.size() >= SLOT_LIMIT:
		game_over = true
		message_label.text = "Поражение: все 3 ячейки заняты, а пиксели остались."
	elif eaten == 0:
		message_label.text = "Ой! Команда не нашла добычу. Одна ячейка потеряна."
	else:
		message_label.text = "Отличная работа! Выбери следующую команду."
	_refresh_all()

func _refresh_grid_only() -> void:
	for i in range(grid_box.get_child_count()):
		var child := grid_box.get_child(i)
		var y := int(i / level[0].size())
		var x := i % level[0].size()
		var style := StyleBoxFlat.new()
		var color: String = level[y][x]
		style.bg_color = Color("#26352e") if color.is_empty() else COLORS[color]
		style.set_corner_radius_all(7)
		child.add_theme_stylebox_override("panel", style)

func _restart() -> void:
	_build_level()
	_build_ui()
	_refresh_all()
