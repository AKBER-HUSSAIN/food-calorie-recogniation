import React from 'react';
import { Award, BarChart3, Info, Flame, Activity, Wheat, Droplets } from 'lucide-react';
import { formatFoodName } from '../utils/formatters';

export default function PredictionResults({ result, isPredicting }) {
  const cardStyle = {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--shadow-md)',
  };

  /* Loading state */
  if (isPredicting) {
    return (
      <div
        style={{
          ...cardStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '3px solid var(--border-default)',
            borderTopColor: 'var(--accent-lime)',
            animation: 'spin-slow 1s linear infinite',
            marginBottom: '20px',
          }}
        />
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
          Analysing Food Item
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0, maxWidth: '280px' }}>
          Running classification across 116 food categories and estimating nutritional content...
        </p>
      </div>
    );
  }

  /* Empty state */
  if (!result) {
    return (
      <div
        style={{
          ...cardStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          textAlign: 'center',
        }}
        className="animate-fade-in-up delay-100"
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-surface-sunken)',
            border: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <BarChart3 size={24} style={{ color: 'var(--text-muted)' }} />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
          Awaiting Analysis
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0, maxWidth: '280px', lineHeight: 1.6 }}>
          Upload a food image and click{' '}
          <span style={{ color: 'var(--accent-coral)', fontWeight: 600 }}>"Analyse Food"</span>{' '}
          to see AI predictions and nutritional estimates.
        </p>
      </div>
    );
  }

  /* Results */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Primary prediction card */}
      <div
        style={{
          ...cardStyle,
          position: 'relative',
          overflow: 'hidden',
          borderColor: 'var(--accent-lime)',
          borderWidth: '1px',
        }}
        className="animate-fade-in-up"
      >
        {/* Subtle glow decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'var(--accent-lime-subtle)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              backgroundColor: 'var(--accent-lime-subtle)',
              color: 'var(--accent-forest)',
              border: '1px solid var(--accent-lime)',
              borderColor: 'rgba(199,244,100,0.3)',
            }}
          >
            <Award size={13} /> Top Match
          </span>
          {result.image_size && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {result.image_size}
            </span>
          )}
        </div>

        <h2
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: '0 0 12px 0',
            lineHeight: 1.2,
          }}
        >
          {formatFoodName(result.predicted_class)}
        </h2>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span
            style={{
              fontSize: '36px',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: 'var(--accent-forest)',
              lineHeight: 1,
            }}
          >
            {result.percentage}
          </span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Confidence</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Softmax probability</div>
          </div>
        </div>

        {/* Confidence bar */}
        <div style={{ marginTop: '16px' }}>
          <div
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              backgroundColor: 'var(--bg-surface-sunken)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: '3px',
                backgroundColor: 'var(--accent-lime)',
                width: `${Math.min(100, (result.confidence || 0) * 100)}%`,
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Top 5 Predictions */}
      <div style={cardStyle} className="animate-fade-in-up delay-100">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0,
            }}
          >
            <BarChart3 size={16} style={{ color: 'var(--accent-coral)' }} />
            Top 5 Predictions
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Probability</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {result.top_5.map((item, index) => {
            const isFirst = index === 0;
            const pctNum = Math.min(100, (item.confidence || 0) * 100);

            return (
              <div key={item.food_class}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isFirst ? 'var(--accent-lime)' : 'var(--bg-surface-sunken)',
                        color: isFirst ? 'var(--accent-lime-text)' : 'var(--text-tertiary)',
                        border: isFirst ? 'none' : '1px solid var(--border-default)',
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: isFirst ? 700 : 500,
                        color: isFirst ? 'var(--text-primary)' : 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatFoodName(item.food_class)}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: isFirst ? 'var(--accent-forest)' : 'var(--text-muted)',
                      flexShrink: 0,
                      marginLeft: '12px',
                    }}
                  >
                    {item.percentage}
                  </span>
                </div>

                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: 'var(--bg-surface-sunken)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: '2px',
                      backgroundColor: isFirst ? 'var(--accent-lime)' : 'var(--border-strong)',
                      width: `${pctNum}%`,
                      transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nutrition Card */}
      {result.nutrition && (
        <div style={cardStyle} className="animate-fade-in-up delay-200">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--nutrition-calories-bg)',
                  border: '1px solid var(--nutrition-calories-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Flame size={16} style={{ color: 'var(--nutrition-calories)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Nutrition Estimate
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  Nutrition5k deep learning model
                </p>
              </div>
            </div>
          </div>

          {/* Nutrition grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}
          >
            <NutritionMetric
              label="Calories"
              value={result.nutrition.calories}
              unit="kcal"
              icon={<Flame size={15} />}
              colorVar="calories"
            />
            <NutritionMetric
              label="Protein"
              value={result.nutrition.protein_g}
              unit="g"
              icon={<Activity size={15} />}
              colorVar="protein"
            />
            <NutritionMetric
              label="Carbs"
              value={result.nutrition.carbs_g}
              unit="g"
              icon={<Wheat size={15} />}
              colorVar="carbs"
            />
            <NutritionMetric
              label="Fat"
              value={result.nutrition.fat_g}
              unit="g"
              icon={<Droplets size={15} />}
              colorVar="fat"
            />
          </div>

          {/* Macro ratio bar */}
          <MacroRatioBar nutrition={result.nutrition} />

          {/* Disclaimer */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-surface-sunken)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <Info size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              Nutritional values are AI estimates from the Nutrition5k model and may vary by preparation, ingredients, and portion size. Not a substitute for professional dietary guidance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* Nutrition metric card */
function NutritionMetric({ label, value, unit, icon, colorVar }) {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: `var(--nutrition-${colorVar}-bg)`,
        border: `1px solid var(--nutrition-${colorVar}-border)`,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: `var(--nutrition-${colorVar})`,
          }}
        >
          {label}
        </span>
        <span style={{ color: `var(--nutrition-${colorVar})`, opacity: 0.7 }}>
          {icon}
        </span>
      </div>
      <div>
        <span
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
            marginLeft: '4px',
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

/* Macronutrient ratio bar */
function MacroRatioBar({ nutrition }) {
  const protein = Number(nutrition.protein_g) || 0;
  const carbs = Number(nutrition.carbs_g) || 0;
  const fat = Number(nutrition.fat_g) || 0;
  const total = protein + carbs + fat;

  if (total <= 0) return null;

  const pPct = Math.round((protein / total) * 100);
  const cPct = Math.round((carbs / total) * 100);
  const fPct = Math.max(0, 100 - pPct - cPct);

  return (
    <div style={{ marginTop: '16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Macro Ratio
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 500,
          }}
        >
          <span style={{ color: 'var(--nutrition-protein)' }}>P {pPct}%</span>
          <span style={{ color: 'var(--nutrition-carbs)' }}>C {cPct}%</span>
          <span style={{ color: 'var(--nutrition-fat)' }}>F {fPct}%</span>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          backgroundColor: 'var(--bg-surface-sunken)',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <div
          style={{
            width: `${pPct}%`,
            backgroundColor: 'var(--nutrition-protein)',
            transition: 'width 0.5s ease',
          }}
          title={`Protein: ${pPct}%`}
        />
        <div
          style={{
            width: `${cPct}%`,
            backgroundColor: 'var(--nutrition-carbs)',
            transition: 'width 0.5s ease',
          }}
          title={`Carbs: ${cPct}%`}
        />
        <div
          style={{
            width: `${fPct}%`,
            backgroundColor: 'var(--nutrition-fat)',
            transition: 'width 0.5s ease',
          }}
          title={`Fat: ${fPct}%`}
        />
      </div>
    </div>
  );
}
