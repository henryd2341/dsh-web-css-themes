window.__ModuleLoader__.load({
  id: "dsh-web-css-themes",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    var React = require("react");
    var e = React.createElement;

    var BASE = "/api2/css-themes";
    var CSS_BASE = "/dsh-themes";
    var LINK_ID = "dsh-theme-stylesheet";

    // Shared layout/color values; the page itself is themed, so we read the
    // official --dsw-* tokens instead of hardcoding colors.
    var styles = {
      page: {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        width: "100%",
        maxWidth: "760px",
        color: "var(--dsw-alias-label-primary)"
      },
      panel: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "14px",
        border: "1px solid var(--dsw-alias-border-l2)",
        borderRadius: "10px",
        background: "var(--dsw-alias-bg-layer-1)"
      },
      row: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap"
      },
      title: {
        margin: "0",
        fontSize: "13px",
        lineHeight: "20px",
        fontWeight: 600
      },
      hint: {
        margin: "0",
        fontSize: "12px",
        lineHeight: "18px",
        color: "var(--dsw-alias-label-tertiary)"
      },
      card: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        padding: "10px 12px",
        border: "1px solid var(--dsw-alias-border-l2)",
        borderRadius: "8px",
        background: "var(--dsw-alias-bg-layer-2)",
        cursor: "pointer"
      },
      cardActive: {
        outline: "2px solid var(--dsw-alias-brand-primary)",
        outlineOffset: "-1px"
      },
      cardTitle: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        minWidth: 0
      },
      themeName: {
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--dsw-alias-label-primary)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      },
      badge: {
        display: "inline-flex",
        alignItems: "center",
        padding: "1px 8px",
        borderRadius: "999px",
        fontSize: "11px",
        lineHeight: "18px",
        color: "var(--dsw-alias-label-primary-foreground)",
        background: "var(--dsw-alias-brand-primary)"
      },
      buttonRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexShrink: 0
      },
      button: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: "28px",
        padding: "0 12px",
        borderRadius: "7px",
        border: "1px solid var(--dsw-alias-border-l3)",
        background: "var(--dsw-alias-bg-layer-3)",
        color: "var(--dsw-alias-label-primary)",
        font: "inherit",
        fontSize: "12px",
        cursor: "pointer"
      },
      primaryButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: "28px",
        padding: "0 12px",
        borderRadius: "7px",
        border: "1px solid transparent",
        background: "var(--dsw-alias-button-primary-fill)",
        color: "var(--dsw-alias-label-primary-foreground)",
        font: "inherit",
        fontSize: "12px",
        cursor: "pointer"
      },
      dangerButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: "28px",
        padding: "0 12px",
        borderRadius: "7px",
        border: "1px solid var(--dsw-alias-border-l3)",
        background: "transparent",
        color: "var(--dsw-alias-state-error-primary)",
        font: "inherit",
        fontSize: "12px",
        cursor: "pointer"
      },
      input: {
        height: "32px",
        padding: "0 10px",
        borderRadius: "7px",
        border: "1px solid var(--dsw-alias-border-l3)",
        background: "var(--dsw-alias-bg-layer-3)",
        color: "var(--dsw-alias-label-primary)",
        font: "inherit",
        fontSize: "13px",
        boxSizing: "border-box"
      },
      textarea: {
        width: "100%",
        minHeight: "260px",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid var(--dsw-alias-border-l3)",
        background: "var(--dsw-alias-bg-layer-3)",
        color: "var(--dsw-alias-label-primary)",
        fontFamily: "var(--dsh-font-mono, ui-monospace, SFMono-Regular, Consolas, monospace)",
        fontSize: "12px",
        lineHeight: "18px",
        resize: "vertical",
        boxSizing: "border-box"
      },
      error: {
        margin: "0",
        fontSize: "12px",
        lineHeight: "18px",
        color: "var(--dsw-alias-state-error-primary)"
      },
      notice: {
        margin: "0",
        fontSize: "12px",
        lineHeight: "18px",
        color: "var(--dsw-alias-state-success-primary)"
      }
    };

    function sameTheme(id) {
      return function (row) {
        return row.id === id;
      };
    }

    function ensureLiveLink(href) {
      var link = document.getElementById(LINK_ID);
      if (!link) {
        link = document.createElement("link");
        link.id = LINK_ID;
        link.rel = "stylesheet";
        link.setAttribute("data-dsh-css-theme", "true");
        document.head.append(link);
      }
      link.href = href;
      return link;
    }

    function removeLiveLink() {
      var link = document.getElementById(LINK_ID);
      if (link) link.remove();
    }

    async function call(op, body) {
      var init = body === undefined
        ? { method: "GET" }
        : {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body)
          };
      var response = await fetch(BASE + "/" + op, init);
      if (!response.ok) throw new Error("dsh-web-css-themes: " + op + " HTTP " + response.status);
      var envelope = await response.json();
      if (!envelope.ok) throw new Error(envelope.error && envelope.error.message ? envelope.error.message : (op + " failed"));
      return envelope.value;
    }

    async function loadCss(id) {
      var response = await fetch(CSS_BASE + "/" + id + ".css");
      if (!response.ok) throw new Error("loadCss HTTP " + response.status);
      return await response.text();
    }

    function CssThemesSection() {
      var themesState = React.useState([]);
      var themes = themesState[0];
      var setThemes = themesState[1];
      var selectedState = React.useState("");
      var selectedId = selectedState[0];
      var setSelectedId = selectedState[1];
      var draftIdState = React.useState("");
      var draftId = draftIdState[0];
      var setDraftId = draftIdState[1];
      var draftNameState = React.useState("");
      var draftName = draftNameState[0];
      var setDraftName = draftNameState[1];
      var cssState = React.useState("");
      var css = cssState[0];
      var setCss = cssState[1];
      var busyState = React.useState(false);
      var busy = busyState[0];
      var setBusy = busyState[1];
      var errorState = React.useState("");
      var error = errorState[0];
      var setError = errorState[1];
      var noticeState = React.useState("");
      var notice = noticeState[0];
      var setNotice = noticeState[1];

      async function refresh(selectTarget) {
        var rows = await call("list");
        setThemes(rows);
        var active = null;
        for (var i = 0; i < rows.length; i += 1) {
          if (rows[i].active) {
            active = rows[i];
            break;
          }
        }
        var targetId;
        if (typeof selectTarget === "string") {
          targetId = selectTarget;
        } else if (selectTarget === true) {
          targetId = active ? active.id : (rows.length > 0 ? rows[0].id : "");
        } else {
          targetId = selectedId;
        }
        if (targetId) {
          setSelectedId(targetId);
          var row = rows.find(sameTheme(targetId));
          if (row) {
            setDraftId(row.id);
            setDraftName(row.name);
            try {
              setCss(await loadCss(row.id));
            } catch (err) {
              setCss("");
            }
          } else {
            setDraftId("");
            setDraftName("");
            setCss("");
          }
        } else {
          setSelectedId("");
          setDraftId("");
          setDraftName("");
          setCss("");
        }
        return rows;
      }

      React.useEffect(function () {
        refresh(true).catch(function (err) {
          setError(err instanceof Error ? err.message : String(err));
        });
      }, []);

      async function selectTheme(id) {
        setError("");
        setNotice("");
        setSelectedId(id);
        var row = themes.find(sameTheme(id));
        if (!row) return;
        setDraftId(row.id);
        setDraftName(row.name);
        try {
          setCss(await loadCss(row.id));
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }

      async function activateTheme(id) {
        setError("");
        setNotice("");
        setBusy(true);
        try {
          await call("activate", { id: id });
          setThemes(function (rows) {
            return rows.map(function (row) {
              return { id: row.id, name: row.name, active: row.id === id, href: row.href };
            });
          });
          ensureLiveLink(CSS_BASE + "/active.css?t=" + Date.now());
          setNotice("已启用主题： " + id);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setBusy(false);
        }
      }

      async function deactivateTheme() {
        setError("");
        setNotice("");
        setBusy(true);
        try {
          await call("activate", { id: null });
          setThemes(function (rows) {
            return rows.map(function (row) {
              return { id: row.id, name: row.name, active: false, href: row.href };
            });
          });
          removeLiveLink();
          setNotice("已停用自定义主题");
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setBusy(false);
        }
      }

      async function saveDraft() {
        setError("");
        setNotice("");
        if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(draftId) || draftId === "active") {
          setError("主题 id 不合法：仅允许字母、数字、点、下划线、连字符，且不能为 active");
          return;
        }
        setBusy(true);
        try {
          var before = themes.find(sameTheme(draftId));
          var wasActive = before ? before.active : false;
          await call("save", { id: draftId, name: draftName, css: css });
          setNotice("已保存主题： " + draftId);
          await refresh(draftId);
          if (wasActive) ensureLiveLink(CSS_BASE + "/active.css?t=" + Date.now());
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setBusy(false);
        }
      }

      async function deleteDraft() {
        setError("");
        setNotice("");
        if (!draftId) return;
        if (!window.confirm("确定删除主题 " + draftId + " 吗？")) return;
        setBusy(true);
        try {
          var before = themes.find(sameTheme(draftId));
          var wasActive = before ? before.active : false;
          await call("delete", { id: draftId });
          setNotice("已删除主题： " + draftId);
          if (wasActive) removeLiveLink();
          if (selectedId === draftId) {
            setSelectedId("");
            setDraftId("");
            setDraftName("");
            setCss("");
            await refresh("");
          } else {
            await refresh(selectedId);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setBusy(false);
        }
      }

      function newDraft() {
        setError("");
        setNotice("");
        setSelectedId("");
        setDraftId("");
        setDraftName("");
        setCss("/* 在这里编写你的自定义 CSS，可覆盖 --dsw-alias-* 设计令牌。 */\n");
      }

      var cards = themes.map(function (row) {
        return e(
          "div",
          {
            key: row.id,
            style: row.id === selectedId ? Object.assign({}, styles.card, styles.cardActive) : styles.card,
            onClick: function () {
              selectTheme(row.id);
            }
          },
          e("div", { style: styles.cardTitle },
            e("span", { style: styles.themeName }, row.name),
            e("span", { style: { fontSize: "12px", color: "var(--dsw-alias-label-tertiary)", fontVariantNumeric: "tabular-nums" } }, row.id),
            row.active ? e("span", { style: styles.badge }, "使用中") : null
          ),
          e("div", { style: styles.buttonRow },
            row.active
              ? null
              : e("button", {
                  type: "button",
                  style: styles.primaryButton,
                  disabled: busy,
                  onClick: function (event) {
                    event.stopPropagation();
                    activateTheme(row.id);
                  }
                }, "启用"),
            e("button", {
              type: "button",
              style: styles.button,
              onClick: function (event) {
                event.stopPropagation();
                selectTheme(row.id);
              }
            }, "编辑")
          )
        );
      });

      return e("div", { style: styles.page },
        e("div", { style: styles.panel },
          e("h3", { style: styles.title }, "CSS 主题"),
          e("p", { style: styles.hint }, "主题以 .css 文件保存在 $DSH_HOME/web-themes，激活后会自动注入到前端 index.html。"),
          cards.length > 0
            ? e("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } }, cards)
            : e("p", { style: styles.hint }, "还没有主题。在下方新建一个，或直接向 $DSH_HOME/web-themes 放入 .css 文件。"),
          e("div", { style: styles.row },
            e("button", { type: "button", style: styles.button, onClick: newDraft }, "新建主题"),
            themes.some(function (row) { return row.active; })
              ? e("button", { type: "button", style: styles.dangerButton, disabled: busy, onClick: deactivateTheme }, "停用自定义主题")
              : null
          )
        ),
        e("div", { style: styles.panel },
          e("div", { style: styles.row },
            e("input", {
              type: "text",
              placeholder: "主题 id（例如 midnight-cherry）",
              value: draftId,
              style: Object.assign({}, styles.input, { flex: "1 1 180px" }),
              onChange: function (event) {
                setDraftId(event.target.value.trim());
              }
            }),
            e("input", {
              type: "text",
              placeholder: "显示名称（可选）",
              value: draftName,
              style: Object.assign({}, styles.input, { flex: "1 1 220px" }),
              onChange: function (event) {
                setDraftName(event.target.value);
              }
            })
          ),
          e("textarea", {
            value: css,
            style: styles.textarea,
            spellCheck: false,
            onChange: function (event) {
              setCss(event.target.value);
            }
          }),
          error ? e("p", { style: styles.error }, error) : null,
          notice ? e("p", { style: styles.notice }, notice) : null,
          e("div", { style: styles.row },
            e("button", { type: "button", style: styles.primaryButton, disabled: busy, onClick: saveDraft }, "保存主题"),
            draftId ? e("button", { type: "button", style: styles.dangerButton, disabled: busy, onClick: deleteDraft }, "删除此主题") : null
          )
        )
      );
    }

    var inject = ["slots"];

    function apply(ctx) {
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({
          name: "settings.section",
          id: "css-themes",
          order: 30,
          label: function () {
            return "CSS 主题";
          }
        }, CssThemesSection);
      });
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
