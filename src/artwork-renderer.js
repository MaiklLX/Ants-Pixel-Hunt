const DEFS = '<defs>'+
'<linearGradient id="skin" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#c6e58a"/><stop offset=".35" stop-color="#78bd62"/><stop offset=".72" stop-color="#438d52"/><stop offset="1" stop-color="#245c42"/></linearGradient>'+
'<radialGradient id="skinLight" cx=".28" cy=".18" r=".85"><stop stop-color="#e2f5a7"/><stop offset=".48" stop-color="#8dc96d"/><stop offset="1" stop-color="#39794b"/></radialGradient>'+
'<radialGradient id="eye" cx=".34" cy=".25" r=".72"><stop stop-color="#fffef1"/><stop offset=".68" stop-color="#f4e6c2"/><stop offset="1" stop-color="#b8a889"/></radialGradient>'+
'<radialGradient id="pupil" cx=".3" cy=".24" r=".8"><stop stop-color="#526e75"/><stop offset=".35" stop-color="#172d38"/><stop offset="1" stop-color="#07151d"/></radialGradient>'+
'<linearGradient id="wing" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff1c7"/><stop offset=".28" stop-color="#f7a9c9"/><stop offset=".64" stop-color="#bd73bd"/><stop offset="1" stop-color="#644e9b"/></linearGradient>'+
'<linearGradient id="wingBlue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e5fbff"/><stop offset=".35" stop-color="#80c9e4"/><stop offset=".72" stop-color="#5488bd"/><stop offset="1" stop-color="#354c83"/></linearGradient>'+
'<linearGradient id="petal" x1=".1" y1="0" x2=".9" y2="1"><stop stop-color="#fff1e6"/><stop offset=".28" stop-color="#ffb6c7"/><stop offset=".7" stop-color="#e86e9b"/><stop offset="1" stop-color="#a94070"/></linearGradient>'+
'<linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c7df81"/><stop offset=".45" stop-color="#6eaa55"/><stop offset="1" stop-color="#2f6845"/></linearGradient>'+
'<linearGradient id="cap" x1=".1" y1="0" x2=".7" y2="1"><stop stop-color="#ffb16b"/><stop offset=".34" stop-color="#e65d4f"/><stop offset=".72" stop-color="#a9363e"/><stop offset="1" stop-color="#6c2638"/></linearGradient>'+
'<linearGradient id="wood" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#f4d39a"/><stop offset=".4" stop-color="#c78b4c"/><stop offset=".78" stop-color="#9a5e35"/><stop offset="1" stop-color="#633e2c"/></linearGradient>'+
'<linearGradient id="shell" x1=".1" y1="0" x2=".9" y2="1"><stop stop-color="#f6d18a"/><stop offset=".3" stop-color="#d88a4d"/><stop offset=".68" stop-color="#99523b"/><stop offset="1" stop-color="#57364a"/></linearGradient>'+
'<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e5faff"/><stop offset="1" stop-color="#6bb7d7"/></linearGradient>'+
'<radialGradient id="glow"><stop stop-color="#fffde0"/><stop offset=".35" stop-color="#ffe88b"/><stop offset=".72" stop-color="#ffb64d" stop-opacity=".85"/><stop offset="1" stop-color="#ff9d39" stop-opacity="0"/></radialGradient>'+
'<filter id="shadow" x="-35%" y="-35%" width="170%" height="180%"><feGaussianBlur in="SourceAlpha" stdDeviation="7"/><feOffset dy="8"/><feComponentTransfer><feFuncA type="linear" slope=".28"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
'<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter>'+
'<pattern id="grain" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="3" cy="5" r=".8" fill="#fff" opacity=".17"/><circle cx="13" cy="12" r=".65" fill="#3b4b39" opacity=".12"/><path d="M7 16l2-1" stroke="#fff" stroke-width=".7" opacity=".12"/></pattern>'+
'</defs>';
const M = {
frog:
'<g filter="url(#shadow)"><ellipse cx="175" cy="310" rx="112" ry="20" fill="#254c3c" opacity=".2"/>'+
'<path d="M83 252Q42 267 49 304Q55 332 100 324L137 291M267 252Q308 267 301 304Q295 332 250 324L213 291" fill="url(#skin)" stroke="#2d6947" stroke-width="5"/>'+
'<path d="M82 220Q54 245 68 280Q80 302 112 287L132 258M268 220Q296 245 282 280Q270 302 238 287L218 258" fill="url(#skinLight)" stroke="#397a4d" stroke-width="5"/>'+
'<ellipse cx="175" cy="185" rx="126" ry="119" fill="url(#skin)" stroke="#2c6845" stroke-width="7"/>'+
'<path d="M68 179Q78 92 151 75Q222 54 279 123Q298 151 286 194Q261 141 220 132Q162 113 111 157Q88 173 68 179Z" fill="#b3db7c" opacity=".55"/>'+
'<ellipse cx="115" cy="95" rx="48" ry="52" fill="url(#skinLight)" stroke="#397a4d" stroke-width="6"/><ellipse cx="235" cy="95" rx="48" ry="52" fill="url(#skinLight)" stroke="#397a4d" stroke-width="6"/>'+
'<ellipse cx="115" cy="100" rx="30" ry="34" fill="url(#eye)"/><ellipse cx="235" cy="100" rx="30" ry="34" fill="url(#eye)"/>'+
'<ellipse cx="120" cy="103" rx="16" ry="23" fill="url(#pupil)"/><ellipse cx="240" cy="103" rx="16" ry="23" fill="url(#pupil)"/>'+
'<ellipse cx="114" cy="94" rx="6" ry="8" fill="#fff"/><ellipse cx="234" cy="94" rx="6" ry="8" fill="#fff"/>'+
'<path d="M96 207Q124 244 175 246Q226 244 254 207" fill="none" stroke="#285c42" stroke-width="7" stroke-linecap="round"/>'+
'<path d="M116 209Q143 230 175 231Q207 230 234 209" fill="none" stroke="#d4ed9a" stroke-width="3" stroke-linecap="round"/>'+
'<ellipse cx="89" cy="196" rx="18" ry="10" fill="#ed8d86" opacity=".55"/><ellipse cx="261" cy="196" rx="18" ry="10" fill="#ed8d86" opacity=".55"/>'+
'<path d="M132 267Q175 284 218 267" fill="none" stroke="#c5e48b" stroke-width="5" opacity=".65"/></g>'+
'<g fill="url(#grain)" opacity=".5"><ellipse cx="175" cy="185" rx="126" ry="119"/></g>',
butterfly:
'<g filter="url(#shadow)"><path d="M169 174C119 89 45 39 31 93C13 156 69 199 154 203C73 212 43 270 74 304C112 343 158 274 174 220Z" fill="url(#wing)" stroke="#684d87" stroke-width="6"/>'+
'<path d="M181 174C231 89 305 39 319 93C337 156 281 199 196 203C277 212 307 270 276 304C238 343 192 274 176 220Z" fill="url(#wingBlue)" stroke="#405b89" stroke-width="6"/>'+
'<path d="M169 174C119 89 45 39 31 93C13 156 69 199 154 203" fill="none" stroke="#fff4db" stroke-width="5" opacity=".7"/><path d="M181 174C231 89 305 39 319 93C337 156 281 199 196 203" fill="none" stroke="#e9faff" stroke-width="5" opacity=".7"/>'+
'<path d="M160 188Q111 132 56 91M157 196Q99 188 48 149M158 207Q101 235 78 282M190 188Q239 132 294 91M193 196Q251 188 302 149M192 207Q249 235 272 282" fill="none" stroke="#fff0d6" stroke-width="3" opacity=".65"/>'+
'<ellipse cx="112" cy="135" rx="23" ry="32" fill="#f7e4a9" opacity=".8"/><ellipse cx="238" cy="135" rx="23" ry="32" fill="#f7e4a9" opacity=".8"/>'+
'<ellipse cx="112" cy="135" rx="11" ry="17" fill="#8b5da5"/><ellipse cx="238" cy="135" rx="11" ry="17" fill="#527eaf"/>'+
'<ellipse cx="111" cy="133" rx="5" ry="7" fill="#fff" opacity=".85"/><ellipse cx="237" cy="133" rx="5" ry="7" fill="#fff" opacity=".85"/>'+
'<path d="M175 116C157 152 155 218 175 264C195 218 193 152 175 116Z" fill="url(#wood)" stroke="#684a48" stroke-width="5"/>'+
'<path d="M170 126Q142 89 130 72M180 126Q208 89 220 72" fill="none" stroke="#58435e" stroke-width="4" stroke-linecap="round"/><circle cx="130" cy="72" r="5" fill="#e9c77e"/><circle cx="220" cy="72" r="5" fill="#e9c77e"/></g>',
flower:
'<g filter="url(#shadow)"><path d="M175 186Q166 248 177 330" stroke="#39734a" stroke-width="17" fill="none" stroke-linecap="round"/>'+
'<path d="M172 269Q117 221 83 258Q103 306 171 288M179 294Q230 239 269 275Q247 321 179 311" fill="url(#leaf)" stroke="#356d46" stroke-width="5"/>'+
'<path d="M165 271Q128 260 98 266M185 295Q224 281 254 282" stroke="#d5e79b" stroke-width="3" fill="none" opacity=".8"/>'+
'<g fill="url(#petal)" stroke="#b34f7a" stroke-width="4">'+
'<ellipse cx="175" cy="85" rx="39" ry="66"/><ellipse cx="175" cy="85" rx="39" ry="66" transform="rotate(45 175 165)"/><ellipse cx="175" cy="85" rx="39" ry="66" transform="rotate(90 175 165)"/><ellipse cx="175" cy="85" rx="39" ry="66" transform="rotate(135 175 165)"/><ellipse cx="175" cy="85" rx="39" ry="66" transform="rotate(180 175 165)"/><ellipse cx="175" cy="85" rx="39" ry="66" transform="rotate(225 175 165)"/><ellipse cx="175" cy="85" rx="39" ry="66" transform="rotate(270 175 165)"/><ellipse cx="175" cy="85" rx="39" ry="66" transform="rotate(315 175 165)"/></g>'+
'<g fill="none" stroke="#ffe5e7" stroke-width="3" opacity=".75"><path d="M175 165L175 37M175 165L266 74M175 165L303 165M175 165L266 256M175 165L175 293M175 165L84 256M175 165L47 165M175 165L84 74"/></g>'+
'<circle cx="175" cy="165" r="45" fill="#e5a83e" stroke="#a96a32" stroke-width="6"/><circle cx="175" cy="165" r="33" fill="#f8d86b"/>'+
'<g fill="#8b572e" opacity=".8"><circle cx="160" cy="151" r="3"/><circle cx="178" cy="145" r="3"/><circle cx="192" cy="159" r="3"/><circle cx="164" cy="177" r="3"/><circle cx="184" cy="183" r="3"/><circle cx="174" cy="165" r="3"/><circle cx="151" cy="166" r="2.5"/><circle cx="198" cy="177" r="2.5"/></g></g>',
mushroom:
'<g filter="url(#shadow)"><path d="M122 172Q113 207 121 281Q126 313 175 316Q224 313 229 281Q237 207 228 172Z" fill="url(#wood)" stroke="#8c634b" stroke-width="6"/>'+
'<path d="M137 201Q175 216 213 201M132 229Q175 242 218 229M134 258Q175 270 216 258" stroke="#f5ddb4" stroke-width="5" fill="none" opacity=".8"/>'+
'<path d="M38 171C44 89 104 45 175 47C246 45 306 89 312 171Q281 207 175 209Q69 207 38 171Z" fill="url(#cap)" stroke="#762f3d" stroke-width="7"/>'+
'<path d="M52 160Q79 80 156 66Q223 53 286 116" stroke="#ffd0a0" stroke-width="7" fill="none" opacity=".5"/>'+
'<g fill="#fff0d9" opacity=".95"><ellipse cx="104" cy="126" rx="15" ry="11"/><ellipse cx="163" cy="91" rx="19" ry="13"/><ellipse cx="229" cy="119" rx="14" ry="10"/><ellipse cx="270" cy="153" rx="10" ry="7"/><ellipse cx="144" cy="159" rx="12" ry="8"/></g>'+
'<path d="M50 171Q88 194 125 197M225 197Q267 192 300 171" fill="none" stroke="#f8c4a2" stroke-width="5" opacity=".8"/>'+
'<path d="M125 188Q133 216 143 226M147 195Q151 221 157 230M175 197V232M203 195Q199 220 193 230M225 188Q217 215 207 226" stroke="#b47c70" stroke-width="3" fill="none" opacity=".75"/></g>',
acorn:
'<g filter="url(#shadow)"><path d="M175 88Q105 99 94 192Q91 278 175 318Q259 278 256 192Q245 99 175 88Z" fill="url(#wood)" stroke="#70452f" stroke-width="7"/>'+
'<path d="M119 164Q175 190 231 164M109 207Q175 234 241 207M123 251Q175 278 227 251" fill="none" stroke="#f3c987" stroke-width="6" opacity=".55"/>'+
'<path d="M88 133Q93 73 175 66Q257 73 262 133Q241 171 175 169Q109 171 88 133Z" fill="#8c6040" stroke="#60412f" stroke-width="7"/>'+
'<path d="M105 121Q175 83 245 121M115 139Q175 111 235 139" stroke="#c38d59" stroke-width="5" fill="none"/>'+
'<path d="M175 70Q169 37 191 23Q207 15 218 28" fill="none" stroke="#6b4831" stroke-width="13" stroke-linecap="round"/>'+
'<path d="M175 70Q174 40 195 28" fill="none" stroke="#b98754" stroke-width="4" stroke-linecap="round"/>'+
'<g fill="#f7dba6" opacity=".65"><circle cx="142" cy="197" r="4"/><circle cx="194" cy="220" r="3"/><circle cx="161" cy="269" r="3"/><circle cx="218" cy="178" r="3"/></g></g>',
snail:
'<g filter="url(#shadow)"><path d="M59 269Q78 222 128 227Q172 229 211 254Q244 274 292 265Q316 262 321 284Q319 309 283 314L91 315Q48 312 59 269Z" fill="url(#leaf)" stroke="#3d7048" stroke-width="7"/>'+
'<path d="M91 278Q164 260 229 283Q265 294 297 285" stroke="#d7eaa2" stroke-width="5" fill="none" opacity=".7"/>'+
'<path d="M230 244Q240 194 247 155M284 254Q290 204 294 171" stroke="#47794e" stroke-width="11" fill="none" stroke-linecap="round"/>'+
'<ellipse cx="248" cy="148" rx="20" ry="24" fill="url(#skinLight)" stroke="#3c704a" stroke-width="5"/><ellipse cx="294" cy="164" rx="20" ry="24" fill="url(#skinLight)" stroke="#3c704a" stroke-width="5"/>'+
'<circle cx="254" cy="147" r="7" fill="#243a35"/><circle cx="300" cy="163" r="7" fill="#243a35"/><circle cx="256" cy="144" r="2.5" fill="#fff"/><circle cx="302" cy="160" r="2.5" fill="#fff"/>'+
'<circle cx="157" cy="190" r="100" fill="url(#shell)" stroke="#67433d" stroke-width="8"/>'+
'<path d="M157 190C105 128 57 192 109 236C160 280 234 223 202 162C177 116 110 132 112 181C114 216 153 229 175 207C194 188 174 162 157 171" fill="none" stroke="#f4cb8a" stroke-width="12" stroke-linecap="round"/>'+
'<path d="M157 190C105 128 57 192 109 236" fill="none" stroke="#ffe4b0" stroke-width="4" opacity=".7"/>'+
'<ellipse cx="117" cy="120" rx="24" ry="12" fill="#fff0ce" opacity=".35" transform="rotate(-36 117 120)"/></g>',
rocket:
'<g filter="url(#shadow)"><path d="M175 35C111 80 111 191 136 259L175 301L214 259C239 191 239 80 175 35Z" fill="url(#sky)" stroke="#557c91" stroke-width="7"/>'+
'<path d="M175 35C144 75 139 151 144 216Q175 237 206 216C211 151 206 75 175 35Z" fill="#f4f0df" opacity=".88"/>'+
'<path d="M175 42Q141 103 146 190Q175 211 204 190Q209 103 175 42Z" fill="url(#cap)" opacity=".92"/>'+
'<circle cx="175" cy="153" r="35" fill="#496b82" stroke="#e9e3ce" stroke-width="9"/><circle cx="175" cy="153" r="24" fill="url(#wingBlue)"/><ellipse cx="165" cy="143" rx="8" ry="5" fill="#fff" opacity=".7"/>'+
'<path d="M136 221Q105 235 91 292Q125 290 158 268ZM214 221Q245 235 259 292Q225 290 192 268Z" fill="#d95e4d" stroke="#873f43" stroke-width="6"/>'+
'<path d="M151 266Q130 303 151 335Q165 350 175 350Q185 350 199 335Q220 303 199 266Z" fill="url(#glow)" opacity=".9"/>'+
'<path d="M162 273Q151 304 175 329Q199 304 188 273Z" fill="#ffb64d"/><path d="M170 282Q163 303 175 314Q187 303 180 282Z" fill="#fff2b1"/></g>',
bird:
'<g filter="url(#shadow)"><path d="M77 230Q64 161 125 118Q178 82 247 121Q291 149 292 211Q273 276 196 289Q112 296 77 230Z" fill="url(#wood)" stroke="#704d3c" stroke-width="7"/>'+
'<path d="M106 208Q136 134 225 134Q254 136 271 170Q220 161 188 201Q148 246 106 208Z" fill="url(#wingBlue)" stroke="#4c6b83" stroke-width="5"/>'+
'<path d="M121 199Q157 166 216 155M133 218Q168 187 220 178M150 233Q179 211 217 201" fill="none" stroke="#d8f1ee" stroke-width="5" opacity=".7"/>'+
'<path d="M276 179L333 199L277 216Z" fill="#e4ad52" stroke="#9b6c36" stroke-width="5"/>'+
'<ellipse cx="244" cy="162" rx="22" ry="25" fill="#f5e9d1"/><circle cx="250" cy="163" r="10" fill="#24323a"/><circle cx="253" cy="159" r="3.5" fill="#fff"/>'+
'<path d="M105 244Q69 267 58 294Q100 295 143 273" fill="#b86e45" stroke="#754736" stroke-width="5"/>'+
'<path d="M160 282L151 315M203 283L210 315" stroke="#8c603e" stroke-width="7" stroke-linecap="round"/><path d="M141 317L163 317M198 317L220 317" stroke="#b27b45" stroke-width="6" stroke-linecap="round"/></g>',
firefly:
'<g filter="url(#shadow)"><ellipse cx="175" cy="231" rx="104" ry="112" fill="url(#glow)" opacity=".62"/>'+
'<path d="M151 143C93 70 62 97 89 161Q113 194 157 190M199 143C257 70 288 97 261 161Q237 194 193 190" fill="url(#wingBlue)" stroke="#557b91" stroke-width="5" opacity=".82"/>'+
'<path d="M151 166Q109 129 93 151M199 166Q241 129 257 151" fill="none" stroke="#e6fbff" stroke-width="4" opacity=".75"/>'+
'<ellipse cx="175" cy="217" rx="63" ry="91" fill="url(#leaf)" stroke="#355d43" stroke-width="7"/>'+
'<path d="M132 191Q175 209 218 191M128 221Q175 241 222 221M139 253Q175 270 211 253" fill="none" stroke="#31563d" stroke-width="12"/>'+
'<ellipse cx="175" cy="278" rx="43" ry="48" fill="url(#glow)" stroke="#d6a747" stroke-width="5"/>'+
'<ellipse cx="175" cy="278" rx="27" ry="32" fill="#f6df78" opacity=".94"/>'+
'<path d="M155 278Q175 291 195 278" fill="none" stroke="#e7a94b" stroke-width="5" stroke-linecap="round"/>'+
'<circle cx="175" cy="111" r="53" fill="url(#skinLight)" stroke="#3d754c" stroke-width="7"/>'+
'<ellipse cx="157" cy="107" rx="9" ry="13" fill="#f7f0d7"/><ellipse cx="193" cy="107" rx="9" ry="13" fill="#f7f0d7"/>'+
'<circle cx="159" cy="108" r="5" fill="#263b35"/><circle cx="195" cy="108" r="5" fill="#263b35"/>'+
'<circle cx="161" cy="106" r="2" fill="#fff"/><circle cx="197" cy="106" r="2" fill="#fff"/>'+
'<path d="M158 66Q142 39 127 38M192 66Q208 39 223 38" stroke="#584c3b" stroke-width="5" fill="none" stroke-linecap="round"/>'+
'<circle cx="127" cy="38" r="5" fill="#e6c46e"/><circle cx="223" cy="38" r="5" fill="#e6c46e"/>'+
'<path d="M143 292L126 326M207 292L224 326" stroke="#416c47" stroke-width="8" stroke-linecap="round"/></g>',
bee:
'<g filter="url(#shadow)"><path d="M126 145Q89 89 112 61Q145 36 170 111M224 145Q261 89 238 61Q205 36 180 111" fill="url(#wingBlue)" stroke="#7199ad" stroke-width="5" opacity=".88"/>'+
'<path d="M111 177Q104 111 175 103Q246 111 239 177L224 252Q175 304 126 252Z" fill="#f0bf4b" stroke="#75502f" stroke-width="7"/>'+
'<path d="M119 154Q175 172 231 154M119 202Q175 222 231 202M130 248Q175 268 220 248" stroke="#543d31" stroke-width="20" fill="none"/>'+
'<ellipse cx="151" cy="133" rx="8" ry="11" fill="#fff3cf"/><ellipse cx="199" cy="133" rx="8" ry="11" fill="#fff3cf"/><circle cx="153" cy="135" r="4" fill="#28323a"/><circle cx="201" cy="135" r="4" fill="#28323a"/>'+
'<path d="M156 91Q143 62 126 56M194 91Q207 62 224 56" stroke="#5e4637" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="126" cy="56" r="5" fill="#5e4637"/><circle cx="224" cy="56" r="5" fill="#5e4637"/>'+
'<path d="M159 287Q175 315 191 287" fill="none" stroke="#765034" stroke-width="7" stroke-linecap="round"/></g>',
firefly:
'<g filter="url(#shadow)"><ellipse cx="175" cy="201" rx="48" ry="98" fill="url(#wood)" stroke="#704b36" stroke-width="7"/>'+
'<path d="M142 150Q94 70 56 104Q27 134 116 204Q136 216 151 203Z" fill="url(#wingBlue)" stroke="#577a8b" stroke-width="6"/>'+
'<path d="M208 150Q256 70 294 104Q323 134 234 204Q214 216 199 203Z" fill="url(#wingBlue)" stroke="#577a8b" stroke-width="6"/>'+
'<path d="M132 169Q91 127 63 113M218 169Q259 127 287 113" stroke="#e8fbf5" stroke-width="5" fill="none" opacity=".8"/>'+
'<path d="M149 160Q175 177 201 160M142 188Q175 208 208 188M143 218Q175 239 207 218" stroke="#6c4836" stroke-width="9" fill="none"/>'+
'<path d="M157 115Q140 78 122 71M193 115Q210 78 228 71" stroke="#62483a" stroke-width="5" fill="none" stroke-linecap="round"/>'+
'<circle cx="122" cy="71" r="5" fill="#62483a"/><circle cx="228" cy="71" r="5" fill="#62483a"/>'+
'<circle cx="175" cy="270" r="71" fill="url(#glow)" opacity=".78"/><ellipse cx="175" cy="275" rx="31" ry="41" fill="#f7d96f" stroke="#c38b45" stroke-width="6"/><ellipse cx="175" cy="275" rx="17" ry="28" fill="#fff4b2"/>'+
'<path d="M144 247L117 278M206 247L233 278M145 224L119 237M205 224L231 237" stroke="#634b39" stroke-width="6" stroke-linecap="round"/></g>',
cloud:
'<g filter="url(#shadow)"><path d="M76 251Q37 244 43 199Q48 163 87 159Q87 92 150 80Q211 68 241 127Q294 109 315 155Q349 214 293 247Q270 262 76 251Z" fill="url(#sky)" stroke="#639eb9" stroke-width="7"/>'+
'<path d="M68 200Q71 167 108 174Q112 111 157 108Q204 103 219 159Q274 133 292 180Q312 226 266 235Q147 250 68 230Z" fill="#f4fcf8" opacity=".78"/>'+
'<path d="M91 189Q107 148 138 145M157 119Q191 115 205 146M244 161Q277 153 287 184" fill="none" stroke="#fff" stroke-width="8" opacity=".65" stroke-linecap="round"/>'+
'<path d="M103 277Q109 296 99 314M174 277Q181 298 170 320M246 273Q253 291 243 306" stroke="#73b8d3" stroke-width="9" stroke-linecap="round" fill="none"/>'+
'<path d="M92 314Q105 324 116 314M164 320Q177 330 188 320M237 306Q250 316 261 306" stroke="#d2f1f4" stroke-width="5" fill="none" stroke-linecap="round"/></g>',
tree:
'<g filter="url(#shadow)"><path d="M148 345Q165 281 153 216L199 216Q188 287 208 345Z" fill="url(#wood)" stroke="#704b36" stroke-width="7"/>'+
'<path d="M175 259Q119 228 94 186M180 242Q239 214 260 168" fill="none" stroke="#8b5a3b" stroke-width="19" stroke-linecap="round"/>'+
'<g fill="url(#leaf)" stroke="#416f43" stroke-width="6"><circle cx="115" cy="147" r="70"/><circle cx="185" cy="104" r="83"/><circle cx="253" cy="153" r="67"/><circle cx="160" cy="190" r="74"/></g>'+
'<g fill="#d8e99a" opacity=".55"><ellipse cx="104" cy="111" rx="26" ry="14" transform="rotate(-28 104 111)"/><ellipse cx="175" cy="68" rx="34" ry="17" transform="rotate(-18 175 68)"/><ellipse cx="247" cy="123" rx="25" ry="14" transform="rotate(22 247 123)"/><ellipse cx="148" cy="165" rx="24" ry="12"/></g>'+
'<g fill="#f1c76b"><circle cx="113" cy="155" r="7"/><circle cx="212" cy="118" r="8"/><circle cx="169" cy="207" r="7"/><circle cx="266" cy="169" r="6"/></g></g>',
house:
'<g filter="url(#shadow)"><path d="M63 162L175 62L287 162V310H63Z" fill="#e9d5b4" stroke="#76533c" stroke-width="8"/>'+
'<path d="M44 169L175 49L306 169L286 190L175 91L64 190Z" fill="url(#cap)" stroke="#78443c" stroke-width="7"/>'+
'<path d="M93 190H150V249H93Z" fill="url(#wingBlue)" stroke="#6e614d" stroke-width="6"/><path d="M105 219H139M121 191V248" stroke="#f4ead3" stroke-width="5"/>'+
'<path d="M194 214Q194 177 231 177Q268 177 268 214V310H194Z" fill="url(#wood)" stroke="#79553c" stroke-width="6"/>'+
'<circle cx="251" cy="248" r="5" fill="#e8c47e"/><path d="M75 310H275" stroke="#70513a" stroke-width="9" stroke-linecap="round"/>'+
'<path d="M218 91V48Q218 29 238 29H260V125" fill="#9a6b4b" stroke="#704b37" stroke-width="6"/>'+
'<path d="M235 43Q244 30 257 43" stroke="#e7c5a0" stroke-width="4" fill="none"/></g>',
fish:
'<g filter="url(#shadow)"><path d="M53 178Q110 86 227 124Q268 137 294 178Q267 219 227 232Q110 270 53 178Z" fill="url(#wingBlue)" stroke="#385d7e" stroke-width="7"/>'+
'<path d="M245 178L321 117L311 178L321 239Z" fill="url(#cap)" stroke="#874b44" stroke-width="6"/>'+
'<path d="M153 124Q180 89 213 108L190 151Z" fill="#f1b65e" stroke="#95663e" stroke-width="5"/><path d="M154 232Q181 267 214 248L190 206Z" fill="#f1b65e" stroke="#95663e" stroke-width="5"/>'+
'<path d="M93 173Q131 145 173 154M91 188Q132 211 175 199" fill="none" stroke="#c7edf1" stroke-width="5" opacity=".6"/>'+
'<circle cx="104" cy="164" r="17" fill="#fff0d2"/><circle cx="109" cy="165" r="9" fill="#263b4b"/><circle cx="112" cy="161" r="3.5" fill="#fff"/>'+
'<path d="M67 194Q80 204 95 198" stroke="#e3a17c" stroke-width="5" fill="none" stroke-linecap="round"/>'+
'<g fill="#f6d17b" opacity=".75"><circle cx="145" cy="151" r="5"/><circle cx="172" cy="174" r="5"/><circle cx="144" cy="204" r="5"/><circle cx="204" cy="188" r="4"/></g></g>'
};
const MOTIF_ORDER=['flower','tree','mushroom','butterfly','house','fish','snail','rocket','bird','acorn','bee','cloud'];
function sceneLayout(count){
 // Compose every motif as a balanced cluster around the arena centre.
 // All placements are square viewports so character proportions stay natural.
 if(count===1)return [[40,40,370,370]];
 if(count===2)return [[22,127,196,196],[232,127,196,196]];
 // Three motifs form a centred, stable triangle rather than an uneven row.
 return [[22,22,196,196],[232,22,196,196],[127,232,196,196]];
}
export function createArtworkSvg(levelNumber){
 const isStarter=levelNumber<=7;
 const types=isStarter?({1:['frog'],2:['butterfly'],3:['flower'],4:['mushroom'],5:['acorn'],6:['snail'],7:['firefly']})[levelNumber]||['frog']:[];
 let placements=[];
 if(isStarter)placements=[[5,5,35,35]];
 else{
  const count=levelNumber<51?1:levelNumber<301?2:3;
  const variant=(levelNumber+Math.floor(levelNumber/11))%3;
  placements=sceneLayout(count);
  for(let part=0;part<count;part++)types.push(MOTIF_ORDER[(levelNumber*7+part*5+Math.floor(levelNumber/13))%MOTIF_ORDER.length]);
 }
 const body=placements.map((p,i)=>{
  const [x,y,w,h]=p;
  const scale=Math.min(w/350,h/350);
  const drawW=350*scale,drawH=350*scale;
  const offsetX=x+(w-drawW)/2,offsetY=y+(h-drawH)/2;
  return '<g transform="translate('+offsetX+' '+offsetY+') scale('+scale+' '+scale+')">'+(M[types[i]]||M.frog)+'</g>';
 }).join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="450" height="450" viewBox="0 0 450 450">'+DEFS+body+'</svg>';
}
